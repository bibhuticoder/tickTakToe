var boardSize = 5;
var turn = true; // true:X:player1, false:O:player2
var players = {
    name: '',
    score: 0
};
var game = true;

function drawCells() {
    var i, j, html = '<table border="0">';
    $("#board").html(''); //empty the board
    for (i = 0; i < boardSize; i++) {
        html += '<tr>';
        for (j = 0; j < boardSize; j++) {
            html += '<td><div class ="cell cell-' + boardSize + '" data-row="' + i + '"data-col="' + j + '"></div></td>';
        }
        html += '</tr>';
    }
    html += '</table>';
    $("#board").html(html);

    setBoardPosition();

    $(".cell").click(function () {
        if (game) {
            if (turn && $(this).text() === '') {
                $(this).text('X');
            } else if ($(this).text() === '') {
                $(this).text('O');
            }

            var winner = checkWinner();
            if (winner !== null) {
                if (winner) {
                    toast('win', getTurn(turn) + " Won");
                    game = false;
                }

            } else {
                toast('draw', 'Its a draw');
                game = false;
            }
            turn = !turn;
        }
    });

}

function checkWinner() {
    var i, j;
    var draw = true;
    var arr = [];
    var arrH = [];
    var arrV = [];
    var arrDr = [];
    var arrDl = [];

    for (i = 0; i < boardSize; i++) {
        for (j = 0; j < boardSize; j++) {

            //horizontal
            arrH.push(($("[data-row=" + i + "][data-col=" + j + "]").text()));

            //vertical
            arrV.push(($("[data-row=" + j + "][data-col=" + i + "]").text()));

            //diagnol down-left
            if (i + j === boardSize - 1) arrDl.push(($("[data-row=" + i + "][data-col=" + j + "]").text()));

            // false
            if ($("[data-row=" + i + "][data-col=" + j + "]").text() === '') {
                draw = false;
            }

        }
        //diagnol down-right
        arrDr.push(($("[data-row=" + i + "][data-col=" + i + "]").text()));

        if (checkArrayEqual(arrH)) {
            $("[data-row=" + i + "]").addClass('cell-winner');
            return true;
        } else arrH = [];

        if (checkArrayEqual(arrV)) {
            $("[data-col=" + i + "]").addClass('cell-winner');
            return true;
        } else arrV = [];

    }

    if (checkArrayEqual(arrDr)) {
        for (j = 0; j < boardSize; j++) {
            $("[data-col=" + j + "][data-row=" + j + "]").addClass('cell-winner');
        }
        return true;
    } else arrDr = [];

    if (checkArrayEqual(arrDl)) {
        for (i = 0; i < boardSize; i++) {
            for (j = 0; j < boardSize; j++)
                if (i + j === boardSize - 1) $("[data-col=" + j + "][data-row=" + i + "]").addClass('cell-winner');
        }
        return true;
    } else arrDl = [];

    if (draw) return null;
}

function checkArrayEqual(array) {
    var i = 0;
    var equal = true;
    for (i = 1; i < array.length; i++) {
        if (array[0] !== array[i] || array[i] === '') {
            equal = false;
            break;
        }
    }
    return equal;
}

function getTurn(turn) {
    if (turn) return 'X';
    else return 'O';
}

function setBoardPosition() {
    $("#boardContainer").css('margin-top', (window.innerHeight - parseInt($("#board").css('height')) - parseInt($("#topBar").css('height'))) / 2);

    $("#boardContainer").css('margin-left', (window.innerWidth - parseInt($("#board").css('width'))) / 2);
    $("#boardContainer").css('margin-right', (window.innerWidth - parseInt($("#board").css('width'))) / 2);
}

function toast(condition, msg) {
    if (condition === 'win') {
        $("#alertBox").removeClass('alert-danger');
        $("#alertBox").addClass('alert-success');
        $("#btnRestart").show();
    } else if (condition === 'lose') {
        $("#alertBox").addClass('alert-danger');
        $("#alertBox").removeClass('alert-success');
        $("#btnRestart").hide();
    } else if (condition === 'draw') {
        $("#alertBox").addClass('alert-danger');
        $("#alertBox").removeClass('alert-success');
    }

    $("#alertMessage").text(msg);
    $("#alertBox").fadeIn(100);
}

function setReady() {
    drawCells();
    setBoardPosition();

    $("#alertBox").hide();

    turn = true;
    game = true;
}

window.onresize = function () {
    setBoardPosition();
}

$("#btnRestart").click(function () {
    setReady();
});

setReady();