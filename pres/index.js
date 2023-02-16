"use strict";

init();
function init() {
  console.info(`Help:
- Press -> for next slide.
- Press <- for previous slide.
- Click for next slide.
- Right click for previous slide.
- Tap for next slide.
- Two finger tap for previous slide.`);

  initQuerySlideIndex();
  addEventListeners();
}

function initQuerySlideIndex() {
  const url = new URL(location.href);
  if (url.searchParams.get("slide")) {
    let slideIndex = parseInt(url.searchParams.get("slide")) - 1;
    if (slideIndex < 0) {
      slideIndex = 0;
    } else if (slideIndex > document.body.children.length - 1) {
      slideIndex = document.body.children.length - 1;
    }
    hideSlide(document.body.children[0]);
    showSlide(document.body.children[slideIndex]);
  } else {
    replaceQuerySlideIndex(1);
  }
}

function next() {
  const visibleSlide = document.querySelector(".slide-visible");
  hideSlide(visibleSlide);
  if (visibleSlide.nextElementSibling) {
    showSlide(visibleSlide.nextElementSibling);
  } else {
    showSlide(visibleSlide.parentElement.firstElementChild);
  }
}

function prev() {
  const visibleSlide = document.querySelector(".slide-visible");
  hideSlide(visibleSlide);
  if (visibleSlide.previousElementSibling) {
    showSlide(visibleSlide.previousElementSibling);
  } else {
    showSlide(visibleSlide.parentElement.lastElementChild);
  }
}

function showSlide(slide) {
  slide.classList.add("slide-visible");
  setQuerySlideIndex(getElementIndex(slide));
}

function hideSlide(slide) {
  slide.classList.remove("slide-visible");
}

function setQuerySlideIndex(index) {
  const url = new URL(location.href);
  url.searchParams.set("slide", index);
  history.pushState({}, "", url);
}

function replaceQuerySlideIndex(index) {
  const url = new URL(location.href);
  if (url.searchParams.get("slide") !== `${index}`) {
    url.searchParams.set("slide", index);
    history.replaceState({}, "", url);
  }
}

function getElementIndex(el) {
  var index = 0;
  while ((el = el.previousElementSibling)) {
    index++;
  }
  console.info(index);
  return index + 1;
}

function addEventListeners() {
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
}
