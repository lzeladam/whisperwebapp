from flask import Flask, render_template, send_from_directory, request, jsonify
import whisper
import logging
from pydub import AudioSegment
import os
app = Flask(__name__)

@app.route('/')
def home():
    return render_template("index.html")

@app.route("/transcribir", methods=["POST"])
def transcribir():
    logging.info("Recibiendo audio desde el frontend...")
    audio_file = request.files['audio_file']
    audio_file_content = audio_file.read()
    logging.info("recuperando audio desde el frontend...")
    with open(os.path.abspath(f'static/audio/audio.ogg'), 'wb') as f:
        f.write(audio_file_content)
    logging.info("Invocando a whisper...")
    model = whisper.load_model("medium")
    transcription = model.transcribe("./static/audio/audio.ogg")
    transcripcion = transcription["text"]
    return transcripcion

if __name__ == '__main__':
    app.run(debug=True)
