const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { exec } = require('child_process');
const fs = require('fs');
var Gpio = require('pigpio').Gpio, //include pigpio to interact with the GPIO

ledRed = new Gpio(4, {mode: Gpio.OUTPUT}), //use GPIO pin 4 as output for RED
ledGreen = new Gpio(17, {mode: Gpio.OUTPUT}), //use GPIO pin 17 as output for GREEN
ledBlue = new Gpio(27, {mode: Gpio.OUTPUT}), //use GPIO pin 27 as output for BLUE
redRGB = 0, //set starting value of RED variable to off (0 for common cathode)
greenRGB = 0, //set starting value of GREEN variable to off (0 for common cathode)
blueRGB = 0; //set starting value of BLUE variable to off (0 for common cathode)



app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

function handler (req, res) { //what to do on requests to port 8080
  fs.readFile(__dirname + '/public/rgb.html', function(err, data) { //read file rgb.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from rgb.html
    return res.end();
  });
}

io.on('connection', (socket) => {
  console.log('Cliente conectado');

  const captureImage = () => {
    exec('fswebcam -q --no-banner /tmp/capture.jpg', (error) => {
      if (error) {
        console.error(`Error al capturar imagen: ${error.message}`);
        return;
      }
  
      fs.readFile('/tmp/capture.jpg', { encoding: 'base64' }, (err, data) => {
        if (err) {
          console.error(`Error al leer imagen: ${err.message}`);
          return;
        }
        socket.emit('image', data);
      });
    });
  };

  setInterval(captureImage, 1000);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

http.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});


//RESET RGB LED
ledRed.digitalWrite(0); // Turn RED LED off
ledGreen.digitalWrite(0); // Turn GREEN LED off
ledBlue.digitalWrite(0); // Turn BLUE LED off



io.sockets.on('connection', function (socket) {// Web Socket Connection
  socket.on('rgbLed', function(data) { //get light switch status from client
    console.log(data); //output data from WebSocket connection to console

    //for common cathode RGB LED 0 is fully off, and 255 is fully on
    redRGB=parseInt(data.red);
    greenRGB=parseInt(data.green);
    blueRGB=parseInt(data.blue);

    ledRed.pwmWrite(redRGB); //set RED LED to specified value
    ledGreen.pwmWrite(greenRGB); //set GREEN LED to specified value
    ledBlue.pwmWrite(blueRGB); //set BLUE LED to specified value
  });

  
});

process.on('SIGINT', function () { //on ctrl+c
  ledRed.digitalWrite(0); // Turn RED LED off
  ledGreen.digitalWrite(0); // Turn GREEN LED off
  ledBlue.digitalWrite(0); // Turn BLUE LED off
  process.exit(); //exit completely
});


//SERIAL

const { SerialPort, ReadlineParser} = require('serialport')

// Use a `\r\n` as a line terminator
const parser = new ReadlineParser({ 
  delimiter: '\r\n',}) 

const port = new SerialPort({ 
  path: '/dev/ttyACM0', 
  baudRate: 115200,
}) 

port.pipe(parser) 
port.on('open', () => console.log('Port open')) 

parser.on('data', function(data){
//Se guardan los datos obtenidos en la variable sens	
  let sens = data;
//Por medio de la consola se muestran los datos de la variable sens
  console.log(sens);
//Con el metodo emit de la instancia io se emiten los datos que se estan recibiendo en un evento llamado sens	
io.emit('sens',data)
}); 

port.on('close',() => console.log('Port close'))



  