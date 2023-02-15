"use strict";

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
