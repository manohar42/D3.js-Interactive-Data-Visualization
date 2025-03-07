# D3.js Interactive Data Visualization

## Project Overview
This project leverages **D3.js** to create interactive data visualizations. It processes datasets in **CSV and GeoJSON formats** and presents them using dynamic web-based visualizations.

## Key Features
- **D3.js Visualization**: Interactive and dynamic visual representations.
- **CSV Data Processing**: Reads and processes multiple datasets.
- **GeoJSON Support**: Geospatial visualization integration.
- **Responsive Web UI**: Styled with CSS for a better user experience.

## Project Structure
```
D3.js-Interactive-Visualization/
│── index.html                 # Main webpage with embedded D3.js visualizations
│── styles.css                 # Styling for the visualization page
│── data/                      # Contains datasets for visualization
│   ├── Abila.geojson          # Geospatial data for mapping
│   ├── MC3output.csv          # Data source for charts
│   ├── risk_score.csv         # Additional processed data
│── .vscode/settings.json      # Development environment settings
│── README.md                  # Project documentation
```

## Installation & Setup
### 1. Prerequisites
Ensure you have:
- A modern web browser (Chrome, Firefox, Edge).
- A local web server (for best performance) such as:
  - Python HTTP Server:
    ```sh
    python -m http.server 8000
    ```
  - Node.js Live Server:
    ```sh
    npx live-server
    ```

### 2. Running the Project
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/D3.js-Interactive-Visualization.git
   ```
2. Navigate to the project folder:
   ```sh
   cd D3.js-Interactive-Visualization
   ```
3. Start a local server and open `index.html` in a browser.

## Data Processing Overview
1. **CSV Data**:
   - Processed dynamically in JavaScript using D3.js.
   - Used to generate various visual elements.

2. **GeoJSON Data**:
   - Contains geographical information for mapping visualizations.

3. **Risk Scores & Grouped Data**:
   - Risk analytics data processed from `risk_score.csv`.

## Customization
- Modify `index.html` to adjust the layout or elements.
- Update `styles.css` for UI customization.
- Add or update datasets in the `data/` folder.

