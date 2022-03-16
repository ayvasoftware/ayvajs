## What is a Tempest Stroke?

Named for its creator, [TempestMAx]{@link https://www.patreon.com/tempestvr}, a ```TempestStroke``` is a behavior that allows specifying oscillatory motion with a formula loosely based on orbital motion calculations. The formula is:

<img style="width:250px" src="./images/tempest-motion.png">

Where ```θ``` is the angle in radians, ```p``` is the _phase_, and ```c``` is the _eccentricity_. Here is a simple graph that shows how these parameters effect the shape of the motion (_try tweaking phase and eccentricity_):

<canvas style="margin-top:20px" width=450 height=100 id="tempest-motion-graph"></canvas>
<div style="display: grid; grid-template-columns: 1fr 1fr; max-width: 50%">
  <b style="justify-self: end">phase (<span id="phase-value">0.00</span>):</b> 
  <input 
    id="phase" 
    type="range" 
    min="-1000" 
    max = "1000" 
    value=0 
    oninput="updateGraph(event)">
  <b style="justify-self: end">eccentricity (<span id="ecc-value">0.00</span>):</b> 
  <input 
    id="ecc" 
    type="range" 
    min="-1000" 
    max = "1000" 
    value=0 
    oninput="updateGraph(event)">
</div>

<script>
  function plot (selector, fn, range) {
    const canvas = document.querySelector(selector);
    const context = canvas.getContext('2d');
    const { width, height } = canvas;

    const widthScale = (width / (range[1] - range[0]));
    const heightScale = ((height - 12) / (range[3] - range[2]));
    let first = true;

    context.lineCap = 'round';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    for (let x = 0; x < width; x++) {
      const xFnVal = (x / widthScale) - range[0];
      let yGVal = (fn(xFnVal) - range[2]) * heightScale;
      
      yGVal = height - 6 - yGVal;
      
      if (first) {
        context.moveTo(x, yGVal);
        first = false;
      }
      else {
        context.lineTo(x, yGVal);
      }
    }

    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.stroke(); 
  }

  function updateGraph (event) {
    let phase = document.querySelector('#phase').value / 100;
    let ecc = document.querySelector('#ecc').value / 100;

    if (event.target.getAttribute('id') === '#phase') {

    } else {

    }

    document.querySelector('#phase-value').textContent = phase.toFixed(2);
    document.querySelector('#ecc-value').textContent = ecc.toFixed(2);

    const fn = (x) => -Math.cos(x + (Math.PI * phase)/2 + ecc * Math.sin(x));

    plot('#tempest-motion-graph', fn, [0, Math.PI * 2, -1, 1]);
  }

  plot('#tempest-motion-graph', (x) => -Math.cos(x), [0, Math.PI * 2, -1, 1]);
</script>

## TBD
