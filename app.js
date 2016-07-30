var app = require('express')();
var path = require('path');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(expressSession({
    secret: 'somesecrettokenhere'
}));
app.use(require('express').static(path.join(__dirname, 'public')));

// view engine setup .. setup ejs engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function Room() {
    this.players = [];
    this.boardSize = 0;
    this.turn = null;
}

Room.prototype.isFull = function () {
    return (this.players.length === 2);
}

Room.prototype.isEmpty = function () {
    return (this.players.length === 0);
}

Room.prototype.changeTurn = function () {
    if (this.turn === this.players[0].username) {
        this.turn = this.players[1].username;
    } else this.turn = this.players[0].username;
}

Room.prototype.addPlayer = function (name, role) {
    this.players.push({
        username: name,
        score: 0,
        role: role
    });
}

Room.prototype.setBoardSize = function (size) {
    this.boardSize = size;
}

var rooms = {};

app.get('/', function (req, res) {
    res.render('login');
});

app.get('/about', function (req, res) {
    res.render('about');
});

app.post('/verify', function (req, res) {
    var roomname = req.body.roomname;
    var username = req.body.username;
    var boardSize = req.body.boardSize[0];

    var r = rooms[roomname];


    if (r) {
        console.log(r.players);
        if (r.isFull())
            res.json({
                type: 'fail',
                msg: 'Roomname is already taken'
            });
        else {
            r.addPlayer(username, 'O');
            res.json({
                type: 'success',
                msg: (roomname + ' is valid')
            });
        }

    } else {
        rooms[roomname] = new Room();
        rooms[roomname].setBoardSize(boardSize);
        rooms[roomname].addPlayer(username, 'X');
        rooms[roomname].turn = username;
        res.json({
            type: 'success',
            msg: (roomname + ' is valid')
        });
    }
});

app.post('/play', function (req, res) {
    var username = req.body.username;
    var roomname = req.body.roomname;
    var boardSize = rooms[roomname].boardSize;
    console.log(username + " @ " + roomname + '(' + boardSize + 'x' + boardSize + ')');
    var r = rooms[roomname];

    res.render('index', {
        username: username,
        roomname: roomname,
        boardSize: boardSize,
        turn: r.turn,
        role: r.players[r.players.length - 1].role
    });
});

app.get('*', function (req, res) {
    res.render('login');
});

io.on('connection', function (socket) {

    console.log(socket.id + " connected");

    //when user connects to the socket io
    socket.on('iWantToJoin', function (data) {

        var roomname = data.roomname;
        var username = data.username;
        var r = rooms[roomname];

        socket.join(roomname);
        socket.roomname = roomname;
        socket.username = username;

        io.in(socket.roomname).emit("newUser", {
            id: socket.id,
            username: username,
            roomname: roomname,
            players: r.players,
        });
    });

    socket.on('clicked', function (data) {
        var r = rooms[data.roomname];
        r.changeTurn();
        data['turn'] = r.turn;
        io.in(data.roomname).emit("clicked", data);
    });

    socket.on('winner', function (data) {
        var r = rooms[socket.roomname];
        var score;
        r.turn = data.username;
        data['winner'] = data.username;

        console.log("Winner is : " + data.winner);

        //increase score
        if (data.username === r.players[0].username) {
            r.players[0].score++;
        } else r.players[1].score++;
        data['players'] = r.players;

        io.in(socket.roomname).emit("winner", data);
    });

    socket.on('draw', function (data) {
        rooms[socket.roomname].turn = data.username;
        data['turn'] = data.username;
        io.in(socket.roomname).emit("draw", data);
    });

    socket.on('restart', function (data) {
        io.in(socket.roomname).emit("restart", data);
    });

    socket.on('disconnect', function (data) {
        console.log(socket.username + " left " + socket.roomname);
        var r = rooms[socket.roomname];
        var players = r.players;

        if (players[0].username === socket.username) {
            r.players.splice(0, 1);
        } else r.players.splice(1, 1);

        if (r.players.length === 0) {
            rooms[socket.roomname] = undefined;
            console.log(socket.roomname + ' deleted');
            console.log(rooms[socket.roomname]);
        }

    });

});

var port = process.env.PORT || 3000;
http.listen(port);
console.log("Listening to port " + port);