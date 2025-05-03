console.log("✅ script.js is loaded");

// ====== 1. Format Helpers ======
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

function formatPace(movingTime, distanceMeters) {
  const paceInSec = movingTime / (distanceMeters / 1000);
  const mins = Math.floor(paceInSec / 60);
  const secs = Math.round(paceInSec % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

function formatCadence(rawCadence) {
    if (!rawCadence) return "—";
    return `${Math.round(rawCadence * 2)} spm`;
  }
  

// ====== 2. Render Activity into Layout ======
function renderActivity(activity) {
    const el = (id) => document.getElementById(id);
  
    if (el("moving_time")) el("moving_time").textContent = formatTime(activity.moving_time);
    if (el("name")) el("name").textContent = activity.name;
    if (el("distance")) el("distance").textContent = (activity.distance / 1000).toFixed(1);
    if (el("average_speed")) el("average_speed").textContent = formatPace(activity.moving_time, activity.distance);
    if (el("total_elevation_gain")) el("total_elevation_gain").textContent = `${activity.total_elevation_gain || 0} m`;
    if (el("average_heartrate")) el("average_heartrate").textContent = activity.average_heartrate != null ? `${Math.round(activity.average_heartrate)} bpm` : "—";
    if (el("average_cadence")) el("average_cadence").textContent = formatCadence(activity.average_cadence);
  }
  

// ====== 3. Download Image Button (Improved) ======
document.getElementById("download-btn").addEventListener("click", () => {
    const container = document.getElementById("runtrition-container");
  
    html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        scrollX: 0,
        scrollY: -window.scrollY
      }).then((canvas) => {
        const croppedCanvas = document.createElement("canvas");
        const context = croppedCanvas.getContext("2d");
      
        croppedCanvas.width = container.offsetWidth * 2; // multiplied by scale
        croppedCanvas.height = container.offsetHeight * 2;
      
        context.drawImage(canvas, 0, 0, croppedCanvas.width, croppedCanvas.height);
      
        const link = document.createElement("a");
        link.download = "runtrition-facts.png";
        link.href = croppedCanvas.toDataURL("image/png");
        link.click();
      });
      


// ====== 4. Connect with Strava Button ======
const clientId = '157732';
const redirectUri = 'https://runtrition.vercel.app';

document.getElementById("connect-strava-btn").addEventListener("click", () => {
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read`;
  window.location.href = stravaAuthUrl;
});
  

// ====== 5. Read ?code=... from URL and Exchange Token via Worker ======
const urlParams = new URLSearchParams(window.location.search);
const stravaCode = urlParams.get('code');

if (stravaCode) {
  const tokenExchangeUrl = 'https://bold-mountain-d948.ysjennifer95.workers.dev/';

  fetch(`${tokenExchangeUrl}?code=${stravaCode}`, {
    headers: { Accept: 'application/json' }
  })
    .then(res => res.json())
    .then(data => {
      console.log("🔍 Raw response from Cloudflare Worker:", data);

      if (!data || !data.access_token) {
        console.error("❌ No access token received. Here’s what came back:", data);
        return;
      }

      const accessToken = data.access_token;
      console.log("✅ Access token received:", accessToken);

      fetch('https://www.strava.com/api/v3/athlete/activities?per_page=5', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => res.json())
        .then(activities => {
          console.log("✅ Activities fetched:", activities);

          const select = document.getElementById("activity-select");
          select.innerHTML = "";

          activities.forEach((act, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = `${act.name} (${formatTime(act.moving_time)})`;
            select.appendChild(option);
          });

          // Show first by default
          console.log("⏳ Waiting to render...");
            setTimeout(() => {
            renderActivity(activities[0]);
            }, 100);

          // Change on dropdown
          select.addEventListener("change", (e) => {
            const selectedIndex = parseInt(e.target.value);
            renderActivity(activities[selectedIndex]);
          });

          console.log("🎯 First activity:", activities[0]);
        })
        .catch(err => {
          console.error("❌ Failed to fetch activities:", err);
        });
    })
    .catch(err => {
      console.error("❌ Failed to get token:", err);
    });
}
