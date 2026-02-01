const generateButton = document.getElementById("generate-report");
const latestReportContent = document.getElementById("latest-report-content");
const reportList = document.getElementById("report-list");

function renderNarrative(narrative) {
  const summary = narrative.summary.map((line) => `<p>${line}</p>`).join("");
  const callouts = narrative.callouts
    .map((item) => `<li>${item}</li>`)
    .join("");

  return `
    <div class="narrative">
      ${summary}
      <h3>Actionable changes</h3>
      <ul>${callouts}</ul>
    </div>
  `;
}

function renderReport(report) {
  return `
    <article class="report">
      <header>
        <strong>Week of ${report.period.start} → ${report.period.end}</strong>
        <span>${new Date(report.created_at).toLocaleString()}</span>
      </header>
      ${renderNarrative(report.narrative)}
      <details>
        <summary>View nutrient totals</summary>
        <div class="totals-grid">
          ${Object.entries(report.comparisons)
            .map(
              ([key, stats]) => `
            <div>
              <p class="metric">${key.replace(/_/g, " ")}</p>
              <p>${stats.actual.toFixed(1)} / ${stats.weekly_target.toFixed(1)}</p>
              <p class="muted">${stats.percent.toFixed(0)}% of target</p>
            </div>
          `
            )
            .join("")}
        </div>
      </details>
    </article>
  `;
}

async function fetchReports() {
  const response = await fetch("/reports");
  const reports = await response.json();
  if (reports.length === 0) {
    reportList.innerHTML = "<p class=\"muted\">No reports yet.</p>";
    latestReportContent.innerHTML = "Generate a report to see insights.";
    return;
  }

  latestReportContent.innerHTML = renderReport(reports[0]);
  reportList.innerHTML = reports.map(renderReport).join("");
}

async function createReport() {
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";
  try {
    const response = await fetch("/reports/weekly", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to create report");
    }
    await fetchReports();
  } catch (error) {
    latestReportContent.innerHTML = `<p class="error">${error.message}</p>`;
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate weekly report";
  }
}

generateButton.addEventListener("click", createReport);
fetchReports();
