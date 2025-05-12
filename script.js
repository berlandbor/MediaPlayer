let stations = [];
let currentStationIndex = 0;

const mediaContainer = document.getElementById("media-container");
let mediaPlayer = document.getElementById("media-player");
const stationName = document.getElementById("station-name");
const stationList = document.getElementById("station-list");
const fileInput = document.getElementById("autoFileInput");

window.onload = () => {
  const saved = localStorage.getItem("media_autoload");
  if (saved) {
    try {
      stations = JSON.parse(saved);
      if (stations.length > 0) {
        generatePlaylist();
        loadStation(0);
        return;
      }
    } catch (e) {
      console.warn("Ошибка чтения из localStorage:", e);
    }
  }
  fileInput.click();
};

fileInput.addEventListener("change", handleFile);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const text = reader.result;
    const isM3U = file.name.endsWith(".m3u");
    const lines = text.split(/\r?\n/);
    let parsed = [];

    if (isM3U) {
      parsed = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#EXTINF")) {
          const nameMatch = line.match(/,(.+)$/);
          const name = nameMatch ? nameMatch[1].trim() : "Без названия";
          const url = lines[i + 1]?.trim();
          if (url && !url.startsWith("#")) {
            parsed.push({ name, url });
            i++;
          }
        } else if (line && !line.startsWith("#") && (i === 0 || !lines[i - 1].startsWith("#EXTINF"))) {
          const name = line.split("/").pop();
          parsed.push({ name, url: line });
        }
      }
    } else {
      parsed = lines.map(line => {
        const [name, url] = line.split(" - ");
        return { name: name?.trim(), url: url?.trim() };
      }).filter(s => s.name && s.url);
    }

    if (parsed.length === 0) {
      alert("Плейлист пуст или формат некорректен.");
      return;
    }

    stations = parsed;
    localStorage.setItem("media_autoload", JSON.stringify(stations));
    generatePlaylist();
    loadStation(0);
  };

  reader.readAsText(file);
}

function generatePlaylist() {
  stationList.innerHTML = "";
  stations.forEach((station, i) => {
    const btn = document.createElement("button");
    btn.textContent = "▶ " + station.name;
    btn.onclick = () => loadStation(i);
    stationList.appendChild(btn);
  });
}

function loadStation(index) {
  if (!stations.length) return;
  currentStationIndex = index;
  const station = stations[currentStationIndex];
  stationName.textContent = station.name;

  const isVideo = /\.(mp4|webm|m3u8|mpd)$/i.test(station.url);
  const newPlayer = document.createElement(isVideo ? "video" : "audio");
  newPlayer.id = "media-player";
  newPlayer.controls = true;
  newPlayer.autoplay = true;
  newPlayer.src = station.url;

  mediaContainer.innerHTML = "";
  mediaContainer.appendChild(newPlayer);
  mediaPlayer = newPlayer;
}

function togglePlay() {
  if (mediaPlayer.paused) {
    mediaPlayer.play();
  } else {
    mediaPlayer.pause();
  }
}

function nextStation() {
  if (!stations.length) return;
  currentStationIndex = (currentStationIndex + 1) % stations.length;
  loadStation(currentStationIndex);
}

function prevStation() {
  if (!stations.length) return;
  currentStationIndex = (currentStationIndex - 1 + stations.length) % stations.length;
  loadStation(currentStationIndex);
}

function clearAutoload() {
  localStorage.removeItem("media_autoload");
  stations = [];
  stationList.innerHTML = "Плейлист очищен";
  stationName.textContent = "Нет станции";
  mediaContainer.innerHTML = `<audio id="media-player" controls></audio>`;
  mediaPlayer = document.getElementById("media-player");
}