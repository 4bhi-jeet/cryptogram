let puzzleData = null;
let initialPuzzleData = null;
let initialRevealed = null;
const maxMistakes = 5;
let mistakes = 0;
let defaultColor = "var(--text-color)";
let correctColor = "#0f9c00";
let wrongColor = "#f08080";

const LOCAL_API = "http://127.0.0.1:5000";
const PROD_API = "https://d-code-jo0j.onrender.com";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? LOCAL_API
  : PROD_API;


function loadPuzzle() {
  mistakes = 0;

  $.getJSON(API_BASE + "/puzzle", function (data) {
    puzzleData = data;
    console.log(puzzleData);
    initialPuzzleData = data.encrypted;   // store encrypted tokens
    initialRevealed = data.revealed;
    renderLives();
    renderPuzzle(data.encrypted, data.revealed);
  });
}

function restartGame() {
  mistakes = 0;
  renderLives();
  $("#status").empty();
  $("#puzzle-wrapper").removeClass("finished")

  // reuse the same puzzle data + revealed
  renderPuzzle(initialPuzzleData, initialRevealed);
}

function renderPuzzle(encrypted, revealed) {
  const $container = $("#puzzle-container");
  $container.empty();

  const counts = puzzleData.letter_counts || {};
  const revealedOnce = {};

  const tokens = encrypted.split(" ");

  // Build words by collecting tokens until we hit a blank token ("")
  let $wordWrapper = $("<div>").addClass("puzzle-word");

  const pushWord = () => {
    if ($wordWrapper.children().length) {
      $container.append($wordWrapper);
      $wordWrapper = $("<div>").addClass("puzzle-word");
    }
  };
  
  tokens.forEach((token, idx) => {
    // Blank token => end of current word
    if (token === "") {
      pushWord();
      return;
    }

    // Punctuation/static tokens
    if (isNaN(token)) {
      $("<div>")
        .addClass("puzzle-char static")
        .text(token)
        .appendTo($wordWrapper);
      return;
    }

    // Numeric token => input + number label
    const $wrapper = $("<div>").addClass("puzzle-char");
    const $numLabel = $("<div>").addClass("number").text(token);
    const $input = $("<input>", {
      name: Math.random().toString(36).slice(2, 7),
      maxlength: 1,
      autocomplete: "off",
    }).attr("data-number", token);

   /*  $wrapper.on("click", function () {
      $(".puzzle-char.active").removeClass("active");
      $wrapper.addClass("active");
    }); */

    const revealedEntry = Object.entries(revealed).find(
      ([letter, num]) => num == token
    );
    if (revealedEntry) {
      const [letter] = revealedEntry;
      const letterCount = counts[letter] || 0;
  
      // Always reveal if only one occurrence
      if (letterCount === 1) {
        $input.val(letter).prop("disabled", true).data("solved", true);
        $wrapper.addClass("revealed");
        revealedOnce[letter] = true;
        $numLabel.addClass("hide");
      } else if (!(letter in revealedOnce)) {
        // Otherwise reveal once at random
        if (Math.random() < 0.5 || idx === tokens.length - 1) {
          $input.val(letter).prop("disabled", true).data("solved", true);
          $wrapper.addClass("revealed");
          revealedOnce[letter] = true;
        }
      }
    }

    $input.on("input", function () {
      const val = $input.val().toUpperCase();

      if (!/^[A-Z]$/.test(val)) {
        $input.val("");
        return;
      }

      $.ajax({
        url: "/check_letter",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ token: token, letter: val }),
        success: function (json) {
          $input.prop("disabled", true);
          if (json.correct) {
            $input.data("solved", true);
            flashColor($wrapper, $input, correctColor);
            if (checkIfPuzzleSolved()) {
              showGameFinish();
            }
          } else {
            flashColor($wrapper, $input, wrongColor);
            loseLife();
          }
        },
        error: function (e) {
          console.log(e)
          // (also fixed a typo: 'nul' -> removed)
          flashColor($wrapper, $input, wrongColor);
          setTimeout(() => $input.val(""), 0);
        },
      });
    });

    
    $wrapper.append($input, $numLabel).appendTo($wordWrapper);
  });

  // Push the last word (if any)
  pushWord();
}


function flashColor($wrapper, $el, color, ms = 800) {
  $el.css("color", color);
  let num = $el.data("number");

  /* $el.animate({
    fontSize: "28px"
  },200, function (){
    $(this).animate({
      fontSize: "unset"
    }, 200);
  }) */
  
  if($el.data("solved")) {
    let $next = $wrapper.nextAll(".puzzle-char").find("input:not([disabled])").not($(".revealed input")).first();

    if (!$next.length) {
      $next = $wrapper.closest(".puzzle-word").nextAll(".puzzle-word").find("input:not([disabled])").not($(".revealed input")).first();
    }

    if (!$next.length) {
      $next = $("#puzzle-container").find("input:not([disabled])").not($(".revealed input")).first();
    }

    if($next.length) {
      $next.focus();
    }
    setTimeout(() => {
      hideNumber(num);
    }, ms);
  } else {
    setTimeout(() => {
      $el.prop("disabled", false).val("").focus();
    }, ms);
    
  }
  setTimeout(() => {
    $el.css("color", defaultColor);
  }, ms);
}

function hideNumber(num) {
  const $inputs = $(`input[data-number="${num}"]`);
  if ($inputs.length === 0) return;
  
  let allSolved = $inputs.toArray().every(
    el =>
      $(el).data("solved") === true
  );
  if (allSolved) {
    $($inputs).parent().find(".number").addClass("hide")
  }
}

function renderLives() {
  const $container = $("#lives-container");
  $container.empty();
  for (let i = 1; i <= maxMistakes; i++) {
    $("<span>")
      .addClass("life")
      .attr("id", `life${i}`)
      .text("◯")
      .appendTo($container);
  }
}

function loseLife() {
  mistakes++;
  $(`#life${mistakes}`).text("✖").css("color", "var(--wrong-color)");
  if (mistakes >= maxMistakes) {
    const $container = $("#puzzle-wrapper");
    $container.addClass("finished");
    const $status = $("#status");
    $status.html(`
      <strong>OOPS!! Game over</strong>
      <div class="next-btn-wrapper">
        <button id="restart-btn">Restart Puzzle</button>
      </div>
    `);

    $("#restart-btn").on("click", function () {
      setTimeout(() => {
        restartGame();
      }, 200);
    });
  }
}

function checkIfPuzzleSolved() {
  let solved = true;
  $(".puzzle-char input").each(function () {
    if (!$(this).data("solved")) {
      solved = false;
      return false; // break loop
    }
  });
  return solved;
}

function showGameFinish() {
  const $container = $("#puzzle-wrapper");
  $container.addClass("finished");
  const $status = $("#status");
  $status.html(`
    <h1>${puzzleData.quote}</h1>
    <strong>${puzzleData.author} - ${puzzleData.who} <br> ${puzzleData.book} [ ${puzzleData.year} ]</strong>
    <div class="next-btn-wrapper">
    <button id="next-btn">Next Puzzle</button>
    </div>
  `);

  $("#next-btn").on("click", function () {
    $status.empty();
    setTimeout(() => {
      loadPuzzle();
      $container.removeClass("finished");
    }, 200);
  });
}

$(document).ready(function () {
  loadPuzzle();
  renderLives();
});

window.addEventListener("mousemove", function autoFocusOnce() {
  const $firstInput = $("#puzzle-container input:not([disabled])").first();
  if ($firstInput.length) {
    $firstInput[0].focus();
    window.removeEventListener("mousemove", autoFocusOnce);
  }
});