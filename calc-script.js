document.addEventListener('DOMContentLoaded', function () {
    const sheetId = '12H5FE6es6LC2s_i4042J_N4s2a_e1A2m2x_bB9g-1cc';
    const sheetName = 'Прайс'; 
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    const loader = document.getElementById('loader');
    const tableBody = document.getElementById('priceTable').getElementsByTagName('tbody')[0];
    const filterInput = document.getElementById('filterInput');
    const totalAmountElement = document.getElementById('totalAmount');
    const finalTotalElement = document.getElementById('finalTotal');
    const tierElement = document.getElementById('tier');
    const savingsElement = document.getElementById('savings');
    const kaspiTotalElement = document.getElementById('kaspiTotal');
    const copyButton = document.querySelector('.copy-btn');
    const whatsappButton = document.querySelector('.whatsapp-btn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    let data = [];
    let priceTiers = {};

    function showLoader(show) {
        if (loader) loader.style.display = show ? 'block' : 'none';
    }

    function parseData(csv) {
        const parsed = Papa.parse(csv, { header: true });
        let products = [];
        let currentCategory = '';

        parsed.data.forEach(row => {
            if (row['Категория'] && row['Категория'].trim() !== '') {
                currentCategory = row['Категория'].trim();
            }
            if (row['Наименование'] && row['Наименование'].trim() !== '') {
                products.push({
                    category: currentCategory,
                    name: row['Наименование'] || '',
                    brand: row['Бренд'] || '',
                    price1: parseFloat(row['Цена 1']) || 0,
                    price2: parseFloat(row['Цена 2']) || 0,
                    price3: parseFloat(row['Цена 3']) || 0,
                    tags: (row['Метки'] || '').split(',').map(t => t.trim()).filter(t => t)
                });
            }
        });
        
        data = products;
        renderTable(data);
        setupCategoryToggles();
    }

    function renderTable(products) {
        tableBody.innerHTML = '';
        let currentCategory = '';

        products.forEach(product => {
            if (product.category !== currentCategory) {
                currentCategory = product.category;
                let categoryRow = tableBody.insertRow();
                categoryRow.className = 'category-row';
                categoryRow.dataset.category = currentCategory;
                let cell = categoryRow.insertCell();
                cell.colSpan = 6;
                cell.textContent = currentCategory;
            }

            let row = tableBody.insertRow();
            row.className = 'product-row';
            row.dataset.category = product.category;
            
            let profitableTag = product.price3 < product.price1 ? `<span class="profitable-tag">Выгодно</span>` : '';

            row.innerHTML = `
                <td class="col-name">
                    <div>${product.name} ${profitableTag}</div>
                    <div class="tags-container">
                        ${product.tags.map(tag => `<span class="tag tag-${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</span>`).join('')}
                    </div>
                </td>
                <td class="col-brand">${product.brand}</td>
                <td class="col-price price-highlight" data-price1="${product.price1}" data-price2="${product.price2}" data-price3="${product.price3}">${formatPrice(product.price1)}</td>
                <td class="col-qty">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" aria-label="Уменьшить">-</button>
                        <input type="number" class="quantity-input" value="0" min="0" data-name="${product.name}" data-brand="${product.brand}">
                        <button class="quantity-btn plus" aria-label="Увеличить">+</button>
                    </div>
                </td>
                <td class="col-sum">0</td>
            `;
        });

        updateTotals();
    }
    
    function setupCategoryToggles() {
        document.querySelectorAll('.category-row').forEach(row => {
            row.addEventListener('click', () => {
                const category = row.dataset.category;
                row.classList.toggle('collapsed');
                document.querySelectorAll(`.product-row[data-category="${category}"]`).forEach(productRow => {
                    productRow.classList.toggle('hidden');
                });
            });
        });
    }

    function filterTable() {
        const filterText = filterInput.value.toLowerCase();
        const rows = tableBody.getElementsByClassName('product-row');
        let visibleCategories = new Set();

        Array.from(rows).forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const brand = row.cells[1].textContent.toLowerCase();
            const isVisible = name.includes(filterText) || brand.includes(filterText);
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visibleCategories.add(row.dataset.category);
            }
        });

        document.querySelectorAll('.category-row').forEach(catRow => {
            catRow.style.display = visibleCategories.has(catRow.dataset.category) ? '' : 'none';
        });
    }

    function updateQuantity(input, delta) {
        let currentValue = parseInt(input.value, 10);
        let newValue = isNaN(currentValue) ? 0 : currentValue + delta;
        if (newValue < 0) newValue = 0;
        input.value = newValue;
        updateRowSum(input.closest('tr'));
    }

    function updateRowSum(row) {
        const priceCell = row.querySelector('.col-price');
        const quantityInput = row.querySelector('.quantity-input');
        const sumCell = row.querySelector('.col-sum');
        
        const quantity = parseInt(quantityInput.value) || 0;
        const price = parseFloat(priceCell.dataset.price1) || 0;
        
        sumCell.textContent = formatPrice(quantity * price);
        updateTotals();
    }

    function updateTotals() {
        let totalAmount = 0;
        const inputs = tableBody.querySelectorAll('.quantity-input');
        inputs.forEach(input => {
            const row = input.closest('tr');
            const price = parseFloat(row.querySelector('.col-price').dataset.price1) || 0;
            totalAmount += (parseInt(input.value) || 0) * price;
        });

        totalAmountElement.textContent = formatPrice(totalAmount);

        let currentTier = 'Цена 1';
        let finalTotal = totalAmount;
        let originalTotal = totalAmount;

        if (totalAmount >= 100000 && totalAmount < 200000) {
            currentTier = 'Цена 2';
            finalTotal = calculateTierTotal(2);
        } else if (totalAmount >= 200000) {
            currentTier = 'Цена 3';
            finalTotal = calculateTierTotal(3);
        }

        tierElement.textContent = currentTier;
        finalTotalElement.textContent = formatPrice(finalTotal);
        
        const savingValue = originalTotal - finalTotal;
        savingsElement.textContent = savingValue > 0 ? `Экономия: ${formatPrice(savingValue)}` : '';

        kaspiTotalElement.textContent = formatPrice(finalTotal * 1.12);
        
        highlightActivePriceColumn(currentTier);
    }

    function calculateTierTotal(tier) {
        let total = 0;
        const inputs = tableBody.querySelectorAll('.quantity-input');
        inputs.forEach(input => {
            const row = input.closest('tr');
            const price = parseFloat(row.querySelector('.col-price').dataset['price' + tier]) || 0;
            total += (parseInt(input.value) || 0) * price;
        });
        return total;
    }

    function highlightActivePriceColumn(tier) {
        document.querySelectorAll('#priceTable th, #priceTable .col-price').forEach(el => {
            el.classList.remove('price-highlight');
        });

        let priceIndex = 2; // Цена 1
        if (tier === 'Цена 2') priceIndex = 2;
        if (tier === 'Цена 3') priceIndex = 2; 

        document.querySelector(`#priceTable th:nth-child(${priceIndex + 1})`).classList.add('price-highlight');
        
        document.querySelectorAll('#priceTable .product-row').forEach(row => {
            const priceCell = row.querySelector('.col-price');
            let priceToShow = 0;
            if (tier === 'Цена 1') priceToShow = priceCell.dataset.price1;
            else if (tier === 'Цена 2') priceToShow = priceCell.dataset.price2;
            else if (tier === 'Цена 3') priceToShow = priceCell.dataset.price3;
            
            priceCell.textContent = formatPrice(priceToShow);
            priceCell.classList.add('price-highlight');
        });
    }

    function generateOrderText() {
        let orderText = 'Здравствуйте, мой заказ:\n';
        let hasItems = false;
        tableBody.querySelectorAll('.quantity-input').forEach(input => {
            if (parseInt(input.value) > 0) {
                hasItems = true;
                orderText += `\n- ${input.dataset.name} (${input.dataset.brand}): ${input.value} шт.`;
            }
        });

        if (!hasItems) return 'Пожалуйста, выберите товары для заказа.';

        orderText += `\n\nИтоговая сумма (${tierElement.textContent}): ${finalTotalElement.textContent} тг.`;
        return orderText;
    }

    function copyOrder() {
        const orderText = generateOrderText();
        if (orderText.startsWith('Пожалуйста')) {
            showToast(orderText, true);
            return;
        }
        navigator.clipboard.writeText(orderText).then(() => {
            showToast('Заказ скопирован в буфер обмена!');
        }, () => {
            showToast('Не удалось скопировать. Пожалуйста, сделайте это вручную.', true);
        });
    }

    function sendToWhatsApp() {
        const orderText = generateOrderText();
        if (orderText.startsWith('Пожалуйста')) {
            showToast(orderText, true);
            return;
        }
        const whatsappUrl = `https://wa.me/77780990459?text=${encodeURIComponent(orderText)}`;
        window.open(whatsappUrl, '_blank');
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast-notification');
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--tag-bestseller-bg)' : 'var(--primary-color)';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(price || 0);
    }

    // Event Listeners
    filterInput.addEventListener('input', filterTable);

    tableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const btn = e.target;
            const input = btn.parentElement.querySelector('.quantity-input');
            const delta = btn.classList.contains('plus') ? 1 : -1;
            updateQuantity(input, delta);
        }
    });

    tableBody.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            updateRowSum(e.target.closest('tr'));
        }
    });

    copyButton.addEventListener('click', copyOrder);
    whatsappButton.addEventListener('click', sendToWhatsApp);

    // Scroll to top button
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    // Initial Load
    showLoader(true);
    fetch(url)
        .then(response => response.text())
        .then(csv => {
            parseData(csv);
            showLoader(false);
        })
        .catch(error => {
            console.error('Error fetching sheet data:', error);
            if(loader) loader.textContent = 'Не удалось загрузить прайс-лист. Попробуйте обновить страницу.';
            showLoader(true);
        });
});
