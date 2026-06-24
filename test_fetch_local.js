fetch('http://localhost:3000/api/devices/100253c515/history')
  .then(res => res.json())
  .then(data => console.log("Response:", JSON.stringify(data, null, 2)))
  .catch(err => console.error("Error:", err));
