const { ipcMain, ipcRenderer } = require('electron');
const os = require( 'os' );
const networkInterfaces = os.networkInterfaces();

const ip = '0.0.0.0';
const port = 0;
const http = require('http');
const server = http.createServer( ( req, res ) => {    
    let collection = '';

    Object.keys(networkInterfaces).forEach( ( v, k ) => {
        collection += `<tr>
                            <td>${v}</td> 
                            <td>${ JSON.stringify(networkInterfaces[v][0]['address']).toString().replace(/^"(.*)"$/, '$1') }</td>
                            <td>${ ( networkInterfaces[v][1] ) ? JSON.stringify(networkInterfaces[v][1]['address']).toString().replace(/^"(.*)"$/, '$1') : '' }</td>
                        </tr>
                        `;
    } );

    res.writeHead( 200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});

    res.write(`<html>
        <head>
            <title>YTMDesktop Companion Server</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h2>YTMDesktop Companion Server</h2>

            <div class="container">
                <table class="striped highlight">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>IPV6</th>
                            <th>IPV4</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${collection}
                    </tbody>
                </table>
            </div>
        </body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
    </html>`);

    res.end();
} );


server.listen(port, ip);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    
    setInterval( function() {
        ipcMain.emit('what-is-song-playing-now');
    }, 1000);

    ipcMain.on('song-playing-now-is', function(data) {
        socket.emit('media-now-playing', data);
    });

    socket.on('media-commands', function( cmd ) {
        switch( cmd ) {
            case 'previous-track':
                ipcMain.emit('media-previous-track', true)
                break;

            case 'play-track': 
                ipcMain.emit('media-play-pause', true);
                break;

            case 'pause-track':
                ipcMain.emit('media-play-pause', true);
                break;

            case 'next-track':
                ipcMain.emit('media-next-track', true)
                break;

            case 'thumbs-up-track':
                ipcMain.emit('media-up-vote', true)
                break;

            case 'thumbs-down-track':
                ipcMain.emit('media-down-vote', true)
                break;
        }
    } );

    socket.on('settings', function( cmd ) {
        switch( cmd ) {
            case 'show-settings':
                ipcMain.emit('show-settings', true);
                break;
        }
    } );



});
setInterval(
    ()=>{
        let port = server.address().port;
        collection = []
        interface = {};
        Object.keys(networkInterfaces).forEach( ( v, k ) => {
            networkInterfaces[v].forEach( ( vv, kk) => {
                if ( vv.family == 'IPv4' ) {
                    collection.push(vv.address.replace(/^"(.*)"$/, '$1') + `:${port}`);
                }
            });
        } );

        console.log("Companion Server listening on" + JSON.stringify(collection));
        ipcMain.emit('register-to-ytmdesktop', JSON.stringify({
            op: 'reg',
            addresses: collection
        }));
    }, 3000
)