// set up basic variables for app

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');
const transcribeButton = document.querySelector(".transcribe");
const transcriptionTextarea = document.querySelector('.transcription');
// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
let mediaRecorder;
let blob;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }
    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt('Cúal es el nombre de la grabación ?','grabacion');

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');
      const deleteButton = document.createElement('button');
      const transcribeButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Borrar';
      deleteButton.className = 'delete';
      transcribeButton.textContent = 'Transcribir';
      transcribeButton.className = 'transcribe';
      transcribeButton.onclick = transcribir;

      if(clipName === null) {
        clipLabel.textContent = 'grabacion';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      clipContainer.appendChild(transcribeButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");
      console.log(blob)
      console.log(typeof blob)
      deleteButton.onclick = function(e) {
        e.target.closest(".clip").remove();
      }

      clipLabel.onclick = function() {
        const existingName = clipLabel.textContent;
        const newClipName = prompt('Ingrese un nuevo nombre para la grabación');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }

    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

// Crea un gradiente de color amarillo a naranja

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;
    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'yellow');
    gradient.addColorStop(1, 'orange');

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    //canvasCtx.strokeStyle = canvasCtx.createLinearGradient(0, 0, canvas.width, 0)
    canvasCtx.strokeStyle = canvasCtx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    canvasCtx.strokeStyle.addColorStop(0, 'red');
    canvasCtx.strokeStyle.addColorStop(1, 'green');

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();


function transcribir() {
  // Obtiene el blob de audio
  const audioElement = document.querySelector('audio');
  const audioBlob = audioElement.src;
  const formData = new FormData();
  formData.append('audio_file', blob, 'audio_blob');
  console.log(audioElement)
  console.log(typeof audioElement)
  console.log("Enviando audio al servidor para transcribir...");
  fetch('/transcribir', {
    method: 'POST',
    body: formData
  })
  .then(response => response.text())
  .then(text => {
    console.log(text);
    console.log('GET response text:', text);
    document.querySelector('.transcription').innerHTML = text;
  });
}

const downloadBtn = document.querySelector('.download-btn');
downloadBtn.addEventListener('click', downloadText);

function downloadText() {
  // obtener el contenido del textarea
  const textarea = document.querySelector('textarea');
  const text = textarea.value;

  // crear un elemento de enlace
  const link = document.createElement('a');

  // crear un archivo de texto en memoria
  const file = new Blob([text], {type: 'text/plain'});

  // establecer la URL del archivo en el elemento de enlace
  link.href = URL.createObjectURL(file);

  // establecer el nombre del archivo
  link.download = 'transcripcion.txt';

  // hacer clic en el elemento de enlace para descargar el archivo
  link.click();
}

function descargarPDF() {
  // Obtén el contenido del textarea
  const contenido = document.querySelector('.transcription').value;

  // Crea un nuevo documento de PDF
  const doc = new jsPDF();

  // Agrega el contenido del textarea al documento de PDF
  doc.text(contenido, 10, 10);

  // Descarga el documento de PDF
  doc.save('transcripcion.pdf');
}