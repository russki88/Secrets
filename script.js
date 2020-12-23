  //creating const for button animation
  const ANIMATEDCLASSNAME = "animated";
  const ELEMENTS = document.querySelectorAll(".hover");
  const ELEMENTS_SPAN = [];

  //button animation
  ELEMENTS.forEach((element, index) => {
    let addAnimation = false;
    if (element.classlist[1] == "flash") {
      element.addEventListener("animationend", e => {
        element.classList.remove(ANIMATEDCLASSNAME);
      });
      addAnimation = true;
    }
    if (!ELEMENTS_SPAN[index]) {
      ELEMENTS_SPAN[index] = element.querySelector("span");
    }
  });
