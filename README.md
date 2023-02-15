# flappy-bird <img src="./favicon.jpg" alt="Favicon" width="32" height="32" style="vertical-align: middle">

https://nhooyr.github.io/flappy-bird/

I wrote this minimal demo game for a short presentation I gave at the [Kaslo, BC
highschool](https://jvh.sd8.bc.ca/) to freshmen and sophmores in early 2023 on how HTML,
CSS and JavaScript integrate together.

\*warning\*: This game is very addictive. Play at your own peril.

<a href="https://nhooyr.github.io/flappy-bird/">
  <img src="./ss.png" alt="Screenshot" height="600">
</a>

## Presentation

The presentation is in [./pres](./pres) and accessible at
https://nhooyr.github.io/flappy-bird/pres/.

<a href="https://nhooyr.github.io/flappy-bird/pres/" >
  <!-- kbd is for adding a border around the preview. -->
  <kbd>
    <img src="./pres/pres.001.jpg" alt="Presentation Preview">
  </kbd>
</a>
<!-- Do not know why but two br are required to separate the kbd border from below -->
<br /><br />

I did not get to them all in my short presentation but these were my discussion points:

- The HTML structure.
- How the CSS works to position the elements and keep the game centered.
  Including on mobile.
- Why I only used a CSS class once.
- How input is received and processed.
- The details HTML element for collapsible help which is relatively unknown method for
  providing expandable information without javascript.
- The bird falling from gravity in the shape of a parabola. Very relevant to them as they
  are learning (or going to be) about parabolas. Of the form `-0.075*x^2`. Kids always
  question if abstract math useful and here is an excellent example!
- How collisions are detected between the bird, ground and pipes.
- How the randomly sized pipes are generated.
- How the high score is persisted between page loads.
- How the prompt is displayed and hidden.
- How the game loop runs and handles both high refresh rates and lag.
  - How the FPS is tracked.
- How to adjust attributes of the game like gravity, time, the bird's flap force, pipe
  speed, pipe gap size etc.
- Canvas being a more performant real world option for writing games due to its GPU
  acceleration. This demo was written purely for educational purposes on how HTML, CSS and
  JavaScript integrate.
  - I have noticed a bit of lag on my 2020 amd64 13" MacBook Pro but it runs buttery smooth
    on my Samsung Galaxy Note20 Ultra at 120 Hz.

## Footer

This is not an endorsement of HTML, CSS or JavaScript. The [HTML
DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) dominates our
industry with widespread support and thus makes for an excellent beginner development
target. Additionally, they were already learning it from their teacher.

Email me directly if you have any questions or bugs to report.
