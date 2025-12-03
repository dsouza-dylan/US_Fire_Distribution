const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATE_NAMES = {
  '01':'alabama','02':'alaska','04':'arizona','05':'arkansas','06':'california','08':'colorado',
  '09':'connecticut','10':'delaware','12':'florida','13':'georgia','15':'hawaii','16':'idaho',
  '17':'illinois','18':'indiana','19':'iowa','20':'kansas','21':'kentucky','22':'louisiana',
  '23':'maine','24':'maryland','25':'massachusetts','26':'michigan','27':'minnesota','28':'mississippi',
  '29':'missouri','30':'montana','31':'nebraska','32':'nevada','33':'new_hampshire','34':'new_jersey',
  '35':'new_mexico','36':'new_york','37':'north_carolina','38':'north_dakota','39':'ohio','40':'oklahoma',
  '41':'oregon','42':'pennsylvania','44':'rhode_island','45':'south_carolina','46':'south_dakota',
  '47':'tennessee','48':'texas','49':'utah','50':'vermont','51':'virginia','53':'washington',
  '54':'west_virginia','55':'wisconsin','56':'wyoming'
};

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight - 140;
const svg = d3.select('#map').attr('width', WIDTH).attr('height', HEIGHT);
const g = svg.append('g');
const tooltip = d3.select('#tooltip');
const debugInfo = d3.select('#debug-info');

let statesData=null, countiesData=null, usMonthlySummary={}, currentMode='us', currentStateName=null, currentStateData=[], currentStateCounties=[], monthlyFireData={};
let projection = d3.geoAlbersUsa().translate([WIDTH/2, HEIGHT/2]).scale(1000);
let path = d3.geoPath().projection(projection);

const backButton = document.getElementById('back-us');

function getStateBucketColor(count) {
  if (count === 0) return '#fffaf5';
  if (count <= 50) return '#ffebd6';
  if (count <= 200) return '#ffc999';
  if (count <= 500) return '#ff9c52';
  if (count <= 1500) return '#f97316';
  return '#b54700';
}

function getCountyBucketColor(count) {
  if (count === 0) return "#fffaf5";
  if (count <= 5) return "#ffebd6";
  if (count <= 25) return "#ffc999";
  if (count <= 100) return "#ff9c52";
  if (count <= 500) return "#f97316";
  return "#b54700";
}

  function getStateFRPColor(frp) {
  if (frp === 0) return '#fffaf5';
  if (frp <= 1000) return '#ffebd6';
  if (frp <= 10000) return '#ffc999';
  if (frp <= 100000) return '#ff9c52';
  if (frp <= 500000) return '#f97316';
  return '#b54700';
}

function getCountyFRPColor(frp) {
  if (frp === 0) return '#fffaf5';
  if (frp <= 50) return '#ffebd6';
  if (frp <= 250) return '#ffc999';
  if (frp <= 1000) return '#ff9c52';
  if (frp <= 5000) return '#f97316';
  return '#b54700';
}

function toggleBackButton(show) {
  backButton.style.display = show ? 'inline-flex' : 'none';
}

function updateDebugInfo(text) {
  debugInfo.html(text);
  console.log(text);
}

backButton.addEventListener('click',()=>{ 
  // Prevent interaction during presentation
  if (window.presentationActive || !window.presentationCompleted) return;
  drawUSView(+monthRangeBottom.value); 
});

Promise.all([
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'),
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'),
  d3.csv('us_summary_2024_monthly.csv')
]).then(([statesJson, countiesJson, summaryCsv])=>{
  statesData = topojson.feature(statesJson, statesJson.objects.states).features;
  countiesData = topojson.feature(countiesJson, countiesJson.objects.counties).features;
  
  summaryCsv.forEach(row=>{
    const state = row.state.toLowerCase();
    const month = +row.month;
    if(!usMonthlySummary[state]) usMonthlySummary[state]={};
    usMonthlySummary[state][month]={
      count: +row.fire_count, 
      brightness: +row.total_brightness,
      frp: +row.total_frp
    };
  });
  
  drawUSView(1);
  monthRangeBottom.value = 1;
  monthLabelBottom.textContent = MONTHS[0];
}).catch(err => {
  console.error('Error loading initial data:', err);
  alert('Failed to load map data: ' + err.message);
});

function drawUSView(monthNum=1){
  currentMode='us'; 
  currentStateName=null;
  toggleBackButton(false);
  
  projection = d3.geoAlbersUsa(); 
  path=d3.geoPath().projection(projection);
  const usFeature={type:"FeatureCollection", features:statesData};
  projection.fitSize([WIDTH, HEIGHT * 0.9], usFeature);
  
  g.transition().duration(750).attr('transform','translate(0,0) scale(1)');
  g.selectAll('*').remove();

  const stateFireData={};
  Object.keys(STATE_NAMES).forEach(fips=>{
    const stateName = STATE_NAMES[fips];
    const data = usMonthlySummary[stateName]?.[monthNum] || {count:0};
    stateFireData[fips]=data.count;
  });

  g.append('g').attr('id','states')
    .selectAll('path')
    .data(statesData)
    .enter()
    .append('path')
    .attr('class','state')
    .attr('d',path)
    .attr('fill', d => {
      const fips = String(d.id).padStart(2, '0');
      const stateName = STATE_NAMES[fips]; 
      const stateData = usMonthlySummary[stateName]?.[monthNum] || {count:0, frp:0};
      return getStateFRPColor(stateData.frp || 0);
    })
    .on('mouseover',(event,d)=>{
      const fips=String(d.id).padStart(2,'0'); 
      const stateName=STATE_NAMES[fips];
      const stateData = usMonthlySummary[stateName]?.[monthNum] || {count:0, frp:0};
      const fires = stateData.count || 0;
      const frp = stateData.frp || 0;
      tooltip.html(`<div style="font-weight:700">${stateName.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
                    <div>${fires.toLocaleString()} fires (${MONTHS[monthNum-1]})</div>
                    <div>Total FRP: ${frp.toLocaleString()} MW</div>`)
        .style('left', event.pageX+'px')
        .style('top', event.pageY+'px')
        .classed('show', true);
    })
    .on('mouseout',()=>tooltip.classed('show',false))
    .on('click',(event,d)=>{
      if(currentMode === 'state') return;
      // Check if presentation is active or not completed
      if (window.presentationActive || !window.presentationCompleted) return;
      const fips=String(d.id).padStart(2,'0'); 
      const stateName=STATE_NAMES[fips];
      zoomToState(fips,stateName);
    });
    
  showStateLegend();
}

async function zoomToState(stateFips, stateName){
  const spinner = document.getElementById('loading-spinner');
  spinner.style.display = 'block';
  updateDebugInfo(`Loading ${stateName}...`);

  try {
    const csvData = await d3.csv(`state_data/${stateName}_2024.csv`);
    
    updateDebugInfo(`Loaded ${csvData.length} rows`);
    
    currentStateData = csvData.map(r => {
      const dateParts = r.acq_date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      
      return {
        latitude: parseFloat(r.latitude), 
        longitude: parseFloat(r.longitude), 
        brightness: parseFloat(r.brightness) || 0,
        frp: parseFloat(r.frp) || 0,
        acq_date: r.acq_date,
        month: month
      };
    });

    console.log('Parsed fires:', currentStateData.length);
    console.log('Sample fire:', currentStateData[0]);

    currentMode = 'state'; 
    currentStateName = stateName;
    toggleBackButton(true);
    
    currentStateCounties = countiesData.filter(d => Math.floor(d.id/1000) === parseInt(stateFips));
    
    if(!currentStateCounties.length){
      alert('No county data for this state'); 
      spinner.style.display = 'none';
      return;
    }

    console.log('Counties found:', currentStateCounties.length);

    g.selectAll('#states path')
      .attr('opacity', d => {
        const fips = String(d.id).padStart(2, '0');
        return fips === stateFips ? 1 : 0.3;
      })
      .style('pointer-events', d => {
        const fips = String(d.id).padStart(2, '0');
        return fips === stateFips ? 'auto' : 'none';
      });
    
    precomputeMonthlyFireData();
    
    const currentMonth = parseInt(monthRangeBottom.value);
    drawCountyHeatmap(currentMonth);

    const bounds = path.bounds({type:"FeatureCollection", features:currentStateCounties});
    const dx = bounds[1][0] - bounds[0][0]; 
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2; 
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = 0.75 * Math.min(WIDTH/dx, HEIGHT/dy);
    const translate = [WIDTH/2 - scale*x, HEIGHT/2 - scale*y];
    
    g.transition().duration(750).attr('transform',`translate(${translate}) scale(${scale})`);
    
    showCountyLegend();

  } catch(err){
    console.error('Error loading state data:', err);
    alert("Failed to load state data: " + err.message);
    updateDebugInfo(`Error: ${err.message}`);
  } finally {
    spinner.style.display = 'none';
  }
}

const monthRangeBottom = document.getElementById('month-range-bottom');
const monthLabelBottom = document.getElementById('month-label-bottom');

monthRangeBottom.addEventListener('input', () => {
  // Prevent interaction during presentation
  if (window.presentationActive || !window.presentationCompleted) return;
  const monthNum = parseInt(monthRangeBottom.value);
  monthLabelBottom.textContent = MONTHS[monthNum - 1];
  if (currentMode === 'state') {
    drawCountyHeatmap(monthNum);
  } else {
    drawUSView(monthNum);
  }
});

function precomputeMonthlyFireData(){
  monthlyFireData = {};
  monthlyFRPData = {}; // new object to store FRP

  currentStateCounties.forEach(c => {
    monthlyFireData[c.id] = Array(12).fill(0);
    monthlyFRPData[c.id] = Array(12).fill(0); // initialize FRP array
  });

  let matchedFires = 0;
  let unmatchedFires = 0;

  currentStateData.forEach(fire => {
    let matched = false;

    for(let i = 0; i < currentStateCounties.length; i++) {
      const county = currentStateCounties[i];
      try {
        if(d3.geoContains(county, [fire.longitude, fire.latitude])) {
          monthlyFireData[county.id][fire.month - 1]++;
          monthlyFRPData[county.id][fire.month - 1] += fire.frp || 0; // accumulate FRP
          matchedFires++;
          matched = true;
          break;
        }
      } catch(e) {
        // silently continue
      }
    }

    if(!matched) {
      unmatchedFires++;
    }
  });

  const debugText = `Fires: ${currentStateData.length}<br>Matched: ${matchedFires}<br>Unmatched: ${unmatchedFires}<br>Counties: ${currentStateCounties.length}`;
  updateDebugInfo(debugText);
}


function drawCountyHeatmap(monthNum){
  if(!currentStateCounties.length) return;

  currentStateCounties.forEach(c => {
    c.fireValue = monthlyFireData[c.id]?.[monthNum-1] || 0;
  });
  
  const maxValue = d3.max(currentStateCounties, d => d.fireValue) || 1;
  console.log(`Drawing heatmap for month ${monthNum}, max fires: ${maxValue}`);

  g.select('#counties').remove();

  g.append('g')
    .attr('id','counties')
    .selectAll('path')
    .data(currentStateCounties)
    .join('path')
    .attr('class','county')
    .attr('d', path)
    .attr('fill', d => {
      const frp = monthlyFRPData[d.id]?.[monthNum-1] || 0;
      const color = getCountyFRPColor(frp);
      return color;
    })
    .on('mouseover', (event, d) => {
      const countyName = d.properties?.name || 'Unknown';
      const fires = monthlyFireData[d.id]?.[monthNum-1] || 0;
      const frp = monthlyFRPData[d.id]?.[monthNum-1] || 0;

      tooltip.html(`<div style="font-weight:700">${countyName} County</div>
                    <div>${fires.toLocaleString()} fires (${MONTHS[monthNum-1]})</div>
                    <div>Total FRP: ${frp.toLocaleString()} MW</div>`)
        .style('left', event.pageX + 'px')
        .style('top', event.pageY + 'px')
        .classed('show', true);
    })
    .on('mouseout', () => tooltip.classed('show', false));
}

function showStateLegend() {
  document.getElementById("legend-state").style.display = "block";
  document.getElementById("legend-county").style.display = "none";
}

function showCountyLegend() {
  document.getElementById("legend-state").style.display = "none";
  document.getElementById("legend-county").style.display = "block";
}

const modeToggle = document.getElementById('mode-toggle');
const modeIcon = modeToggle.querySelector('.icon');

modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  modeIcon.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

// Show debug info temporarily for testing
// debugInfo.style('display', 'block');