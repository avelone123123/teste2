document.addEventListener('DOMContentLoaded', () => {

    // Убеждаемся, что GSAP загрузился. Если нет, то ничего не делаем, и сайт останется видимым.
    if (typeof gsap === 'undefined') {
        console.error("GSAP не загрузился! Анимации не будут работать.");
        document.body.style.visibility = 'visible'; // Показываем сайт в любом случае
        return;
    }
    
    // --- 1. Анимация появления с "физикой" с помощью GSAP ---
    
    // Делаем тело документа видимым, чтобы избежать "прыжка" контента
    gsap.set('body', { visibility: 'visible' });

    const tl = gsap.timeline({
        defaults: {
            ease: "power4.out",
            duration: 1.2
        }
    });
    
    // Теперь мы анимируем 'from' (из) невидимого состояния в видимое.
    // Элементы изначально видимы в CSS, но JS их "перехватывает" и анимирует.
    tl.from('.header', { 
        y: -100, 
        opacity: 0,
        duration: 1
    })
    .from('.hero-title', { 
        y: 50,
        opacity: 0,
        skewX: -10 
    }, "-=0.8")
    .from('.hero-subtitle', { 
        y: 30,
        opacity: 0 
    }, "-=1")
    .from('.links-grid li', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    }, "-=0.8");


    // --- 2. Логика переключения темы (светлая/темная) ---
    const themeSwitcher = document.querySelector('.theme-switcher');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    }

    themeSwitcher.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark-mode');
        } else {
            localStorage.removeItem('theme');
        }
    });

    // --- 3. Динамическое обновление года в футере ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});