"use strict";

console.info(`Help:
- Press -> for next slide.
- Press <- for previous slide.
- Click for next slide.
- Right click for previous slide.
- Tap for next slide.
- Two finger tap for previous slide.`);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") {
    next();
  } else if (e.key === "ArrowLeft") {
    prev();
  }
});

document.addEventListener("click", () => {
  next();
});

let doubleTouch;
document.addEventListener("touchstart", e => {
  doubleTouch = e.touches.length > 1;
});

document.addEventListener("touchend", e => {
  if (doubleTouch) {
    prev();
    doubleTouch = false;
  }
});

document.addEventListener("contextmenu", e => {
  e.preventDefault();
  prev();
});

function next() {
  const slideVisible = document.getElementById("slide-visible");
  slideVisible.id = "";
  if (slideVisible.nextElementSibling) {
    slideVisible.nextElementSibling.id = "slide-visible";
  } else {
    slideVisible.parentElement.children[0].id = "slide-visible";
  }
}

function prev() {
  const slideVisible = document.getElementById("slide-visible");
  slideVisible.id = "";
  if (slideVisible.previousElementSibling) {
    slideVisible.previousElementSibling.id = "slide-visible";
  } else {
    slideVisible.parentElement.children[
      slideVisible.parentElement.children.length - 1
    ].id = "slide-visible";
  }
}
