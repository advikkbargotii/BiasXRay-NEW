// Handle messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  if (request.action === "analyzeText") {
    console.log('Starting text analysis for:', request.text);
    analyzeSelectedText(request.text);
  }
});

// Function to analyze selected text
async function analyzeSelectedText(text) {
  console.log('Creating overlay...');
  let overlay = document.getElementById('biasxray-overlay');
  if (!overlay) {
    console.log('Creating new overlay');
    overlay = createAnalysisOverlay();
  }

  // Show loading state
  overlay.innerHTML = `
    <div class="biasxray-centered-message">
      <div class="spinner"></div>
      <span>Analyzing text...</span>
    </div>
  `;

  try {
    console.log('Making API request...');
    const response = await fetch('http://localhost:9002/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const result = await response.json();
    console.log('Received API response:', result);

    const encodedText = encodeURIComponent(text);
    const fullAnalysisURL = `https://biasxray.org/?text=${encodedText}`;

    // Scores with color coding
    const scoresHTML = `
      <div class="biasxray-score-row">
        <div class="biasxray-score-pill">
          <div class="biasxray-score-label">Bias</div>
          <div class="biasxray-score-value" data-score="${getScoreLevel(result.overallBiasScore)}" title="${getScoreInterpretation(result.overallBiasScore, 'bias')}">${(result.overallBiasScore * 100).toFixed(0)}%</div>
        </div>
        <div class="biasxray-score-pill">
          <div class="biasxray-score-label">Hallucination</div>
          <div class="biasxray-score-value" data-score="${getScoreLevel(result.overallHallucinationScore)}" title="${getScoreInterpretation(result.overallHallucinationScore, 'hallucination')}">${(result.overallHallucinationScore * 100).toFixed(0)}%</div>
        </div>
        <div class="biasxray-score-pill">
          <div class="biasxray-score-label">Ideological</div>
          <div class="biasxray-score-value" data-score="${getScoreLevel(result.overallIdeologicalSkewScore)}" title="${getScoreInterpretation(result.overallIdeologicalSkewScore, 'ideological')}">${(result.overallIdeologicalSkewScore * 100).toFixed(0)}%</div>
        </div>
      </div>
    `;

    // Analysis boxes (new structure)
    const analysisHTML = `
      <div class="biasxray-analysis-list">
        ${
          result.biasDetections.length > 0
            ? result.biasDetections.map(detection => `
                <div class="biasxray-analysis-box">
                  <strong>${detection.biasType}:</strong> ${detection.biasedPhrase}<br/>
                  <em>Suggestion:</em> ${detection.suggestedRewrite}
                </div>
              `).join('')
            : `<div class="biasxray-analysis-box">No significant issues detected.</div>`
        }
      </div>
    `;

    // Display final results
    overlay.innerHTML = `
      <div class="biasxray-title">BiasXRay Analysis</div>
      ${scoresHTML}
      ${analysisHTML}
      <div class="biasxray-footer">
        <button id="biasxray-close" class="biasxray-button biasxray-button-secondary">Close</button>
        <a href="${fullAnalysisURL}" target="_blank" class="biasxray-button biasxray-button-primary">Open Full Analysis</a>
      </div>
    `;

    document.getElementById('biasxray-close').addEventListener('click', () => overlay.remove());

  } catch (error) {
    console.error('Error analyzing text:', error);
    overlay.innerHTML = `
      <div class="biasxray-error-message">
        <span>Error analyzing text. Please try again.</span>
        <button id="biasxray-close" class="biasxray-button biasxray-button-secondary">Close</button>
      </div>
    `;
    document.getElementById('biasxray-close').addEventListener('click', () => overlay.remove());
  }
}

// Function to create the analysis overlay
function createAnalysisOverlay() {
  console.log('Creating overlay element');
  const overlay = document.createElement('div');
  overlay.id = 'biasxray-overlay';
  document.body.appendChild(overlay);
  console.log('Overlay added to document');
  return overlay;
}

// Function to get score level for color coding
function getScoreLevel(score) {
  const percentage = score * 100;
  if (percentage <= 25) return 'low';
  if (percentage <= 50) return 'moderate';
  if (percentage <= 75) return 'high';
  return 'critical';
}

// Function to get human-readable score interpretation
function getScoreInterpretation(score, type) {
  const percentage = score * 100;
  const level = getScoreLevel(score);
  
  const interpretations = {
    bias: {
      low: 'Minimal bias detected',
      moderate: 'Some bias concerns',
      high: 'Significant bias issues',
      critical: 'Major bias problems'
    },
    hallucination: {
      low: 'Content appears factual',
      moderate: 'Some factual concerns',
      high: 'Questionable accuracy',
      critical: 'Likely contains errors'
    },
    ideological: {
      low: 'Balanced perspective',
      moderate: 'Slight ideological lean',
      high: 'Strong ideological bias',
      critical: 'Extreme viewpoint'
    }
  };
  
  return interpretations[type]?.[level] || `${percentage.toFixed(0)}% ${type}`;
}

// Add styles for the spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 