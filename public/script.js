const API_URL = "/api/keywords";

const keywordForm = document.getElementById("keywordForm");
const channelIdInput = document.getElementById("channelIdInput");
const channelNameInput = document.getElementById("channelNameInput");
const destinationInput = document.getElementById("destinationInput");
const fullPromptInput = document.getElementById("fullPromptInput");
const themeToggle = document.getElementById("themeToggle");
const keywordInput = document.getElementById("keywordInput");

// Toggle Dark Theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Fetch and display keywords
async function fetchKeywords() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      const keywords = await response.json();
      const keywordTable = document.getElementById("keywordTable");
      keywordTable.innerHTML = ""; // Clear previous rows

      keywords.forEach((keyword) => {
        const div = document.createElement("div");
        div.classList.add("keyword-row");
        
        // Channel ID and Name (first line, medium size, bold)
        const channelInfo = document.createElement("div");
        channelInfo.classList.add("channel-info");
        channelInfo.textContent = `${keyword.channelId} - ${keyword.channelName}`;
        div.appendChild(channelInfo);
        
        // Destination and Prompt (second line, half-half screen)
        const destinationPrompt = document.createElement("div");
        destinationPrompt.classList.add("destination-prompt");
        destinationPrompt.textContent = `Keyword: ${keyword.keywordid} | Destination: ${keyword.destination} | Prompt: ${keyword.prompt}`;
        div.appendChild(destinationPrompt);
        
        // Delete Button (right side, red color)
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "DELETE";
        deleteButton.classList.add("delete-btn");
        deleteButton.onclick = () => deleteKeyword(keyword._id);
        div.appendChild(deleteButton);
        
        // Append to keyword table
        keywordTable.appendChild(div);
        
      });
    } else {
      throw new Error("Invalid response format");
    }
  } catch (err) {
    console.error(`Error fetching keywords: ${err.message}`);
  }
}

// Add a new keyword
async function addKeyword(event) {
  event.preventDefault();

  const channelId = channelIdInput.value.trim();
  const channelName = channelNameInput.value.trim();
  const keywordid = keywordInput.value.trim();
  const destination = destinationInput.value.trim();
  const prompt = fullPromptInput.value.trim();

  if (!channelId || !channelName || !destination || !prompt || !keywordid ){
    return alert("Please fill out all fields!");
  }

  const submitButton = keywordForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channelId, channelName, destination, prompt, keywordid }),
    });

    if (response.status === 201) {
      channelIdInput.value = ''; // Clear input fields
      channelNameInput.value = '';
      destinationInput.value = '';
      fullPromptInput.value = '';
      keywordInput.value = '';
      fetchKeywords(); // Reload keywords
    } else {
      const error = await response.text();
      alert(`Error: ${error}`);
    }
  } catch (err) {
    console.error('Error adding keyword:', err.message);
  } finally {
    submitButton.disabled = false;
  }
}

// Delete a keyword
async function deleteKeyword(id) {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });  // Corrected URL format
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    fetchKeywords();
  } catch (err) {
    console.error(`Error deleting keyword: ${err.message}`);
  }
}

// Initial fetch
fetchKeywords();

// Event listener for adding a keyword
keywordForm.addEventListener("submit", addKeyword);
