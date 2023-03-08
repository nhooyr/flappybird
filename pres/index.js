"use strict";
(function () {
  const slidesContainerEl = document.getElementById("slides-container");
  const helpEl = document.getElementById("help");
  const slideNEL = document.getElementById("slide-n");
  function init() {
    initQuerySlideIndex();
    addEventListeners();
  }

  function initQuerySlideIndex() {
    const url = new URL(location.href);
    if (url.searchParams.get("slide")) {
      let slideIndex = parseInt(url.searchParams.get("slide")) - 1;
      if (slideIndex < 0) {
        slideIndex = 0;
      } else if (slideIndex > slidesContainerEl.children.length - 1) {
        slideIndex = slidesContainerEl.children.length - 1;
      }
      hideSlide(slidesContainerEl.children[0]);
      showSlide(slidesContainerEl.children[slideIndex]);
    } else {
      replaceQuerySlideIndex(1);
    }
  }

  function next() {
    const topSlide = document.querySelector(".slide-top");
    hideSlide(topSlide);
    if (topSlide.nextElementSibling) {
      showSlide(topSlide.nextElementSibling);
    } else {
      showSlide(topSlide.parentElement.firstElementChild);
    }
  }

  function prev() {
    const topSlide = document.querySelector(".slide-top");
    hideSlide(topSlide);
    if (topSlide.previousElementSibling) {
      showSlide(topSlide.previousElementSibling);
    } else {
      showSlide(topSlide.parentElement.lastElementChild);
    }
  }

  function showSlide(slide) {
    slide.classList.add("slide-visible", "slide-top");
    const slideN = getElementIndex(slide);
    setQuerySlideIndex(slideN);
    slideNEL.textContent = `${slideN}`;
  }

  function hideSlide(slide) {
    const prevSlide = document.querySelector(".slide-visible:not(.slide-top)");
    if (prevSlide) {
      prevSlide.classList.remove("slide-visible");
    }
    slide.classList.remove("slide-top");
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
    return index + 1;
  }

  function addEventListeners() {
    document.addEventListener("keydown", e => {
      switch (e.key) {
        case "Enter":
        case " ":
        case "Tab":
        case "ArrowRight":
          e.preventDefault();
          if (!hideHelp()) {
            next();
          }
          break;
        case "ShiftTab":
        case "ArrowLeft":
          e.preventDefault();
          if (!hideHelp()) {
            prev();
          }
          break;
        case "?":
          toggleHelp();
          break;
        case "f":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.body.requestFullscreen();
          }
          break;
        case "Escape":
          hideHelp();
          break;
      }
    });

    document.addEventListener("click", e => {
      if (!helpEl.contains(e.target))
        if (!hideHelp()) {
          next();
        }
    });

    let doubleTouch;
    let tripleTouch;
    document.addEventListener("touchstart", e => {
      if (e.touches.length > 2) {
        tripleTouch = true;
      } else if (e.touches.length > 1) {
        doubleTouch = true;
      }
    });

    document.addEventListener("touchend", e => {
      if (tripleTouch) {
        toggleHelp();
        tripleTouch = false;
        doubleTouch = false;
      } else if (doubleTouch) {
        if (!hideHelp()) {
          prev();
        }
        doubleTouch = false;
      }
    });

    document.addEventListener("contextmenu", e => {
      if (document.fullscreenElement) {
        e.preventDefault();
        if (!hideHelp()) {
          prev();
        }
      }
    });
  }

  function hideHelp() {
    if (helpEl.style.display === "none") {
      return false;
    }
    helpEl.style.display = "none";
    return true;
  }

  function toggleHelp() {
    if (helpEl.style.display === "none") {
      helpEl.style.display = "revert";
    } else {
      helpEl.style.display = "none";
    }
  }

  init();
})();
