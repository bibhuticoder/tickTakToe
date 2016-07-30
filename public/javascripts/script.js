var socket = io();
var boardSize = 0;
var turn = null;
var me = {};
var players = [];
var game = false;

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
            var ok = true;
            if (me.username !== turn) {
                ok = false;
            } else if ($(this).text() !== '') {
                ok = false;
            }

            if (ok) { // if everything is okay               
                socket.emit('clicked', {
                    username: me.username,
                    roomname: me.roomname,
                    mark: me.role,
                    col: $(this).attr('data-col'),
                    row: $(this).attr('data-row')
                });
            }

        }
    });

}

function checkWinner() {

    //returns true on winner and null on draw

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

function setBoardPosition() {
    $("#boardContainer").css('margin-top', (window.innerHeight - parseInt($("#board").css('height')) - parseInt($("#topBar").css('height'))) / 2);

    $("#boardContainer").css('margin-left', (window.innerWidth - parseInt($("#board").css('width'))) / 2);
    $("#boardContainer").css('margin-right', (window.innerWidth - parseInt($("#board").css('width'))) / 2);
}

function toast(condition, msg, restartBtn) {
    if (condition === 'win') {
        $("#alertBox").removeClass('alert-danger');
        $("#alertBox").addClass('alert-success');
    } else if (condition === 'lose') {
        $("#alertBox").addClass('alert-danger');
        $("#alertBox").removeClass('alert-success');
    } else if (condition === 'draw') {
        $("#alertBox").addClass('alert-danger');
        $("#alertBox").removeClass('alert-success');
    }

    $("#btnRestart").hide();
    if (restartBtn) $("#btnRestart").show();
    $("#alertMessage").text(msg);
    $("#alertBox").fadeIn(100);
}

function setReady() {
    boardSize = parseInt($("#server-boardSize").text());
    me["username"] = $("#server-username").text();
    me["roomname"] = $("#server-roomname").text();
    me["role"] = $("#server-role").text();

    turn = $("#server-turn").text();
    restart();

    socket.emit('iWantToJoin', {
        username: me.username,
        roomname: me.roomname
    });
}

function restart() {
    drawCells();
    setBoardPosition();
    $("#alertBox").hide();
}

window.onresize = function () {
    setBoardPosition();
}

$("#btnRestart").click(function () {
    socket.emit('restart');
});

socket.on('newUser', function (data) {

    if (data.username === me.username) {
        me['id'] = data.id;
    }

    if (data.players.length === 2) {
        //set player name in scoreboard
        players = data.players;
        updateViews();
        game = true;
    }

});

socket.on('clicked', function (data) {
    var cell = $('[data-col=' + data.col + '][data-row=' + data.row + ']');
    $(cell).text(data.mark);

    if (data.username === me.username) {
        var winner = checkWinner();
        if (winner !== null) {
            if (winner) {
                socket.emit('winner', {
                    username: data.username
                });
            }

        } else {
            socket.emit('draw', {
                username: data.username
            })
        }
    }

    turn = data.turn;
    updateViews();
});

socket.on('winner', function (data) {
    var score = data.score;
    if (data.winner === me.username) {
        me.score = score;
        toast('win', "You Won", true);
    } else {
        toast('lose', "Looserrrr.... (^_^)", false);
    }
    game = false;
    turn = data.winner;
    players = data.players;
    updateViews();
});

socket.on('draw', function (data) {
    if (turn === me.username) {
        toast('draw', 'Its a draw', true);
    } else toast('draw', 'Its a draw', false);

    turn = data.turn;
    updateViews();

    game = false;
});

function updateViews() {
    $("#turn").text("Turn : " + turn);

    $("#player1Name").text(players[0].username);
    $("#player2Name").text(players[1].username);
    $("#player1Score").text(players[0].score);
    $("#player2Score").text(players[1].score);

}

socket.on('restart', function (data) {
    restart();
    game = true;
});

setReady();