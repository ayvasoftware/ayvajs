> This tutorial assumes basic familiarity with <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a>, TCode, and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">JavaScript</a>.

## Default Configuration
To control a device with an instance of Ayva, the axes for the device must be configured. The default configuration consists of the axes needed to control an OSR2 or SR6 device. An instance of Ayva can use the default configuration by calling the ```defaultConfiguration()``` method:

```
const ayva = new Ayva();
ayva.defaultConfiguration();
```

The defaultConfiguration() method also returns the Ayva instance itself. This allows the above to be reduced to one line:

```
const ayva = new Ayva().defaultConfiguration();
```

The default configuration consists of the following axes:

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th style="font-weight: bold">Name</th>
        <th style="font-weight: bold">Type</th>
        <th style="font-weight: bold">Alias</th>
      </tr>
    </thead>
    <tbody>
      <tr class="deep-level-0">
        <td class="name"><code>L0</code></td>
        <td class="default">linear</td>
        <td class="description last">stroke</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>L1</code></td>
        <td class="default">linear</td>
        <td class="description last">forward</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>L2</code></td>
        <td class="default">linear</td>
        <td class="description last">left</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>R0</code></td>
        <td class="default">rotation</td>
        <td class="description last">twist</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>R1</code></td>
        <td class="default">rotation</td>
        <td class="description last">roll</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>R2</code></td>
        <td class="default">rotation</td>
        <td class="description last">pitch</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>A0</code></td>
        <td class="default">auxiliary</td>
        <td class="description last">valve</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>A1</code></td>
        <td class="default">auxiliary</td>
        <td class="description last">suck</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>A2</code></td>
        <td class="default">auxiliary</td>
        <td class="description last">lube</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>V0</code></td>
        <td class="default">auxiliary</td>
        <td class="description last">vibe0</td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>V1</code></td>
        <td class="default">auxiliary</td>
        <td class="description last">vibe1</td>
      </tr>
    </tbody>
  </table>
</div>

## Axis Configuration
To control a device with an instance of Ayva, the axes for the device must be configured. An axis configuration consists of the following parameters:

<div class="table-container">
  <table class="params table">
    <thead>
      <tr>
        <th style="font-weight: bold">Parameter</th>
        <th style="font-weight: bold">Type</th>
        <th style="font-weight: bold">Attributes</th>
        <th style="font-weight: bold">Default</th>
        <th style="font-weight: bold" class="last">Description</th>
      </tr>
    </thead>
    <tbody>
      <tr class="deep-level-0">
        <td class="name"><code>name</code></td>
        <td class="type">
          <span class="param-type">String</span>
        </td>
        <td class="attributes">
        </td>
        <td class="default">
        </td>
        <td class="description last">
          <p>the machine name of the axis (such as L0, R0, etc...)</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>type</code></td>
        <td class="type">
          <span class="param-type">String</span>
        </td>
        <td class="attributes">
        </td>
        <td class="default">
        </td>
        <td class="description last">
          <p>linear, rotation, or auxiliary</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>alias</code></td>
        <td class="type">
          <span class="param-type">String</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="default">
        </td>
        <td class="description last">
          <p>an alias used to refer to the axis (such as twist, pitch, stroke, etc)</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>max</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="default">
          1
        </td>
        <td class="description last">
          <p>specifies maximum value for the axis</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>min</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="default">
          0
        </td>
        <td class="description last">
          <p>specifies minimum value for the axis</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>

The ```configureAxis()``` method can be used to configure a single axis. Ex:

```
const ayva = new Ayva();

ayva.configureAxis({
  name: 'L0',
  type: 'linear',
  alias: 'stroke',
  max: 0.7,
  min: 0.3,
});

// ...

ayva.move({ 
  axis: 'L0',
  to: 0,
  speed: 1,
});
```
<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-motion-api.html">Motion API</a></div>
