// Fade-in sections on scroll
const faders = document.querySelectorAll(
  "section, .case-card, .step, .partners, .testimonials"
);
const options = {
  threshold: 0.2,
};

const appearOnScroll = new IntersectionObserver(function (
  entries,
  appearOnScroll
) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("appear");
    appearOnScroll.unobserve(entry.target);
  });
},
options);

faders.forEach((fader) => {
  appearOnScroll.observe(fader);
});

// Animate progress bars when visible
const progressBars = document.querySelectorAll(".progress");
const animateProgress = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.style.width;
        bar.style.width = "0";
        setTimeout(() => {
          bar.style.width = width;
        }, 100);
        observer.unobserve(bar);
      }
    });
  },
  { threshold: 0.5 }
);

progressBars.forEach((bar) => {
  animateProgress.observe(bar);
});
// Smooth scroll for "Donate Now"
const donateBtn = document.getElementById("donateBtn");
donateBtn.addEventListener("click", () => {
  window.location.href = "pages/patients.html";
});

document.getElementById("adminBtn").addEventListener("click", () => {
  window.location.href = "pages/admin-dashboard.html";
});
