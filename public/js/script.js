const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const apiTokenInput = document.getElementById('apiToken');
const typeingContainer = document.getElementById('typingContainer');
const playbackContainer = document.getElementById('playbackContainer');

let idStart, idStop;

let startagain = (mediaRecorder) => {
  mediaRecorder.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  idStart = setTimeout(() => stopnstartagain(mediaRecorder), 3000);
}

let stopnstartagain = (mediaRecorder) => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  idStop = setTimeout(() => startagain(mediaRecorder), 200)
}

let stop = (mediaRecorder) => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearTimeout(idStart);
  clearTimeout(idStop);
}

startBtn.addEventListener('click', () => {
  const apiToken = apiTokenInput.value.trim() || OPENAI_API_KEY;
  if (!apiToken) {
    alert('Please enter your OpenAI API token.');
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Media Devices API or getUserMedia is not supported in this browser.');
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      let mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.start();
      setTimeout(() => stopnstartagain(mediaRecorder), 3000);

      mediaRecorder.ondataavailable = event => {
        console.log("ondataavailable", event);

        if (event.data.size > 0) {
          const ablob = new Blob([event.data], { type: "audio/webm;codecs=opus" });
          const aurl = URL.createObjectURL(ablob);
          console.log(ablob, aurl);

          // Create audio element
          const audioElement = document.createElement('audio');
          audioElement.src = aurl;
          audioElement.controls = true; // Add controls so you can play it

          // Append to the body or any other container
          playbackContainer.appendChild(audioElement);

          // Optionally play the audio
          // audioElement.play();
          const afile = new File([ablob], "tmpfile.webm", { type: "audio/webm" });
          console.log(afile);
          transcribe(afile, apiToken);
        }
      };

        startBtn.disabled = true;
        stopBtn.disabled = false;

        stopBtn.addEventListener('click', () => {
          stop(mediaRecorder);
        });
      })
    .catch(error => {
      console.error('Error accessing the microphone', error);
    });

});

function transcribe(afile, apiToken) {
  console.log("transcribing ...")
  const formData = new FormData();
  formData.append('file', afile);
  formData.append('model', 'whisper-1');

  fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiToken,
    },
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      typeText(data.text);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function sendTextToOpenAI(transcription, apiToken) {
  const prompt = `You are an assistant that `
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": prompt },
        { "role": "user", "content": userInput }
      ]
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function typeText(text, delay = 50) {
  let index = 0;

  const typeNextChar = () => {
    // Add next character
    typingContainer.textContent += text.charAt(index);
    index++;

    // Check if there's more to type
    if (index < text.length) {
      setTimeout(typeNextChar, delay);
    }
  };

  typeNextChar(); // Start typing
}
