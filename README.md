# flappy-bird <img src='./favicon.jpg' alt='Favicon' width='32' height='32' style='vertical-align: middle'>

https://nhooyr.github.io/flappy-bird/

<a href='https://nhooyr.github.io/flappy-bird/'>
  <img src='./ss.png' alt='Screenshot' height='600'>
</a>

I wrote this demo game for a short presentation I gave at the [Kaslo,
BC](https://jvh.sd8.bc.ca/) highschool to freshmen and sophmores on how HTML, CSS and JS
can be used to create simple web apps.

The presentation is in [./pres](./pres) and accessible at
https://nhooyr.github.io/flappy-bird/pres/.

<a href='https://nhooyr.github.io/flappy-bird/pres/' >
  <!-- kbd is for adding a border around the preview. -->
  <kbd style="margin-bottom: 50px">
    <img src='./pres/pres.001.jpg' alt='Presentation Preview'>
  </kbd>
</a>
<!-- Not sure why but two br are required to separate the kbd border from below -->
<br>
<br>

Some of the points I discussed:
  - The HTML structure.
  - How the CSS layout works to keep the game centered and of the right size even on mobile.
  - How input is received and processed.
  - The details HTML element for collapsible help which is relatively unknown way for
  providing expandable information without javascript.
  - The falling movement of the bird being in the shape of a parabola. Very relevant to
    them as they're learning (or going to be) about parabolas. Of the form `-0.075*x^2`.
    People always question when is such abstract math useful and here is an excellent
    example!
  - How collisions are detected between the bird, ground and pipes.
  - How the randomly sized pipes are generated.
  - How the high score is persisted between page loads.
  - How the prompt is displayed and hidden.
  - How the game loop runs and handles both high refresh rates and lag.
  - Canvas being a more performant real world option for writing games due to GPU
    acceleration. This was written purely for educational purposes.

note: This isn't an endorsement of HTML, CSS or JS. The HTML DOM just happens to be a
technology that dominates our industry and thus makes for a good software starter toolkit.
And it's what they were already learning from their teacher.

warning: This game is very addictive. Play at your own peril.

Email me directly if you have any questions or bugs to report.
