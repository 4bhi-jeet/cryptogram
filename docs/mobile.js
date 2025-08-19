$(document).ready(function () {
  createKeyboard();
  loadPuzzle();
  renderLives();
  $(document).on("keydown", function(e){
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      handleKeyboardInput(key);
    }
    console.log(e.key.toUpperCase())
  })

  $("#menu").on("click", function(){
    $(".controls").toggle();
  })
});

let puzzleData = null;
let initialPuzzleData = null;
let initialRevealed = null;
const maxMistakes = 5;
let mistakes = 0;
let defaultColor = "var(--text-color)";
let correctColor = "#0f9c00";
let wrongColor = "#f08080";
let activeCell = null; // track selected puzzle cell

const LOCAL_API = "http://127.0.0.1:5000";
const PROD_API = "https://d-code-jo0j.onrender.com";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? LOCAL_API
  : PROD_API;

function createKeyboard() {
  const keyboardDiv = $("#keyboard");
  keyboardDiv.empty();

  const rows = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  rows.forEach(row => {
    const rowDiv = $("<div>").addClass("keyboard-row");

    row.split("").forEach(letter => {
      const button = $("<button>")
        .addClass("key")
        .text(letter)
        .attr("id", "key-" + letter)
        .on("click", function () {
          handleKeyboardInput(letter);
        });

      rowDiv.append(button);
    });

    keyboardDiv.append(rowDiv);
  });
}

function loadPuzzle() {
  mistakes = 0;

  $.getJSON(API_BASE + "/puzzle", function (data) {
    puzzleData = data;
    console.log(data)
    initialPuzzleData = data.encrypted;
    initialRevealed = data.revealed;
    renderLives();
    renderPuzzle(data.encrypted, data.revealed);
  });
}

function restartGame() {
  mistakes = 0;
  renderLives();
  $("#status").empty();
  $("body").removeClass("finished");

  renderPuzzle(initialPuzzleData, initialRevealed);
}

function renderPuzzle(encrypted, revealed) {
  const $container = $("#puzzle-container");
  $container.empty();

  const counts = puzzleData.letter_counts || {};
  const revealedOnce = {};
  const tokens = encrypted.split(" ");
  let $wordWrapper = $("<div>").addClass("puzzle-word");

  const pushWord = () => {
    if ($wordWrapper.children().length) {
      $container.append($wordWrapper);
      $wordWrapper = $("<div>").addClass("puzzle-word");
    }
  };

  tokens.forEach((token, idx) => {
    if (token === "") {
      pushWord();
      return;
    }

    if (isNaN(token)) {
      $("<div>").addClass("puzzle-char static").text(token).appendTo($wordWrapper);
      return;
    }

    const $wrapper = $("<div>").addClass("puzzle-char").attr("data-number", token);
    const $numLabel = $("<div>").addClass("number").text(token);
    const $letterBox = $("<div>").addClass("letter-box").attr("data-number", token);

    $wrapper.append($letterBox, $numLabel).appendTo($wordWrapper);

    const revealedEntry = Object.entries(revealed).find(([letter, num]) => num == token);
    if (revealedEntry) {
      const [letter] = revealedEntry;
      const letterCount = counts[letter] || 0;

      if (letterCount === 1) {
        $letterBox.text(letter).addClass("revealed").data("solved", true);
        $numLabel.addClass("hide");
      } else if (!(letter in revealedOnce)) {
        if (Math.random() < 0.5 || idx === tokens.length - 1) {
          $letterBox.text(letter).addClass("revealed").data("solved", true);
          revealedOnce[letter] = true;
        }
      }
    }

    // click handler to set active cell
    $wrapper.on("click", function () {
      $(".puzzle-char.active").removeClass("active");
      $wrapper.addClass("active");
      activeCell = $wrapper;
    });
  });

  pushWord();
}

function handleKeyboardInput(letter) {
  if (!activeCell) return;

  const token = activeCell.attr("data-number");
  const $letterBox = activeCell.find(".letter-box");
  
  const button = $("#key-" + letter);
  if (button) {
    button.addClass("active");
    setTimeout(() => {
      button.removeClass("active");
    }, 800);
  } 
  
  $.ajax({
    url: API_BASE + "/check_letter",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ token: token, letter: letter }),
    success: function (json) {
      if (json.correct) {
        $letterBox.text(letter).css("color", correctColor).data("solved", true);
        flashAndAdvance(activeCell);
        if (checkIfPuzzleSolved()) {
          showGameFinish();
        }
      } else {
        $letterBox.text(letter).css("color", wrongColor);
        flashAndReset(activeCell);
        loseLife();
      }
    },
    error: function (e) {
      console.log(e);
      $letterBox.text("").css("color", wrongColor);
    }
  });
}

function flashAndAdvance($cell, ms = 800) {
  setTimeout(() => {
    $cell.find(".letter-box").css("color", defaultColor);
    hideNumber($cell.data("number"));

    // focus next unsolved cell
    
  }, ms);
  let $next = $cell.nextAll(".puzzle-char").find(".letter-box:not(.revealed)").filter(function () {
    return !$(this).data("solved");
  }).first();

  if (!$next.length) {
    $next = $cell.closest(".puzzle-word").nextAll(".puzzle-word")
      .find(".letter-box:not(.revealed)").filter(function () {
        return !$(this).data("solved");
      }).first();
  }

  if ($next.length) {
    $(".puzzle-char.active").removeClass("active");
    $next.closest(".puzzle-char").addClass("active");
    activeCell = $next.closest(".puzzle-char");
  }
}

function flashAndReset($cell, ms = 800) {
  setTimeout(() => {
    $cell.find(".letter-box").text("").css("color", defaultColor);
  }, ms);
}

function hideNumber(num) {
  const $cells = $(`.puzzle-char[data-number="${num}"] .letter-box`);
  if ($cells.length === 0) return;

  let allSolved = $cells.toArray().every(el => $(el).data("solved") === true);
  if (allSolved) {
    $(`.puzzle-char[data-number="${num}"] .number`).addClass("hide");
  }
}

function renderLives() {
  const $container = $("#lives-container");
  $container.empty();
  for (let i = 1; i <= maxMistakes; i++) {
    $("<span>").addClass("life").attr("id", `life${i}`).text("◯").appendTo($container);
  }
}

function loseLife() {
  mistakes++;
  $(`#life${mistakes}`).text("✖").css("color", "var(--wrong-color)");
  if (mistakes >= maxMistakes) {
    $("body").addClass("finished");
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
  $(".puzzle-char .letter-box").each(function () {
    if (!$(this).data("solved")) {
      solved = false;
      return false;
    }
  });
  return solved;
}

function showGameFinish() {
  $("body").addClass("finished");
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
      $("body").removeClass("finished");
    }, 200);
  });
}

function toggleTheme() {
  $("body").toggleClass('dark');
}