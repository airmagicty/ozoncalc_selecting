// Author: airmagicty
// Name: Подбрщик для OZON-Калькулятора 
// Version: 0.1 Release
// URL паттерн: https://calculator.ozon.ru/
// chrome-extension: User JavaScript and CSS 3.0.6
// Settings: Изолированая среда (не обязательно)

function getInputPrice() {
  // Находим все элементы label
  const labels = document.querySelectorAll('label');

  // Перебираем их и ищем нужный текст
  let targetLabel;
  for (const label of labels) {
    if (label.textContent.trim() === 'Цена, ₽') {
      targetLabel = label;
      break;
    }
  }

  // Если label найден, получаем его атрибут for
  if (targetLabel) {
    const inputId = targetLabel.getAttribute('for');
    
    // Находим input по id
    const input = document.getElementById(inputId);
    
    if (input) {
      console.log('Найденный input:', input);
      return input;
    } else {
      console.log('Input с id', inputId, 'не найден');
      return false;
    }
  } else {
    console.log('Label с текстом "Цена, ₽" не найден');
    return false;
  }
}

function editInputPrice(inputPrice, newPrice) {
  // 1. Находим инпут по ID
  // const input = document.getElementById(elementID);
  const input = inputPrice;
  
  if (input) {
    // 2. Эмулируем фокус на инпуте
    input.focus();
  
    // 3. Удаляем текущее значение с эмуляцией событий
    input.value = ''; // Очищаем значение
    input.dispatchEvent(new Event('input', { bubbles: true })); // Триггерим событие ввода
    input.dispatchEvent(new Event('change', { bubbles: true })); // Триггерим событие изменения
  
    // 4. Устанавливаем новое значение
    input.value = `${newPrice}`;
  
    // 5. Эмулируем ввод нового значения
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  
    console.log('Значение успешно изменено на 100:', input);
  } else {
    console.error('Инпут не найден');
  }
}  



function clickButtonNewPrice() {
  // Находим кнопку по селектору
  const button = document.querySelector('button.ozi__button__button__TAOtz.ozi__button__size-600__TAOtz.ozi-body-600-true.ozi__button__primary__TAOtz.ozi__button__hug__TAOtz.ozi__button__light__TAOtz._recalculateButton_10hlc_48');
  
  if (button) {
    // Создаем события для полной эмуляции
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      view: window
    });
    
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      view: window
    });
  
    // Запускаем цепочку событий
    button.dispatchEvent(mouseDownEvent);
    button.dispatchEvent(mouseUpEvent);
    button.dispatchEvent(clickEvent);
    
    // Дополнительно триггерим стандартный click
    button.click();
    
    console.log('Клик успешно эмулирован', button);
    return true;
  } else {
    console.error('Кнопка не найдена');
  	return false;
  }
}



function getPriceFromTable() {
  const elements = document.querySelectorAll('.ozi-table-400');
  const lastElement = elements[elements.length - 1];
  
  if (lastElement) {
    const container = lastElement.closest('div[class*="container"]') || lastElement.parentElement;
    
    // Ищем div с числом и валютой
    const priceDiv = Array.from(container.querySelectorAll('div'))
      .find(div => /\d/.test(div.textContent) && div.textContent.includes('₽'));
    
    if (priceDiv) {
      const number = parseInt(
        priceDiv.textContent
          .replace(/\s/g, '') // Убираем все пробелы
          .replace(/−/g, '-') // корректируем минус
          .replace(/[^-\d]/g, ''),
        10
      );
      
      console.log('Распаршенное число:', number);
      return number;
    }
  }
	return false;
}


// Добавляем элементы интерфейса
const interfaceContainer = document.createElement('div');
interfaceContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    padding: 10px;
    border: 1px solid #ccc;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;

const targetPriceInput = document.createElement('input');
targetPriceInput.type = 'number';
targetPriceInput.placeholder = 'Целевая цена, ₽';
targetPriceInput.style.marginBottom = '5px';

const calculateButton = document.createElement('button');
calculateButton.textContent = 'Рассчитать';
calculateButton.style.cssText = `
    display: block;
    margin-bottom: 5px;
    padding: 5px 10px;
`;

const statusDiv = document.createElement('div');
statusDiv.id = 'statusDiv';
statusDiv.style.cssText = `
    max-width: 300px;
    word-wrap: break-word;
    font-size: 14px;
`;

interfaceContainer.appendChild(targetPriceInput);
interfaceContainer.appendChild(calculateButton);
interfaceContainer.appendChild(statusDiv);
document.body.appendChild(interfaceContainer);

// Логика подбора цены
calculateButton.addEventListener('click', async () => {
    const target = parseInt(targetPriceInput.value);
    if (isNaN(target)) {
        statusDiv.textContent = 'Введите корректную целевую цену';
        return;
    }

    const inputEl = getInputPrice();
    if (!inputEl) {
        statusDiv.textContent = 'Ошибка: Инпут цены не найден';
        return;
    }

    let currentPrice = parseInt(inputEl.value) || 0;
    let bestPrice = currentPrice;
    let bestDiff = Infinity;
    let iterations = 0;
    let step = 100;
    let direction = null;

    const updateStatus = (message) => {
        statusDiv.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    };

    const getCurrentResult = async (price) => {
        editInputPrice(inputEl, price);
        clickButtonNewPrice();
        await new Promise(r => setTimeout(r, 500));
        return getPriceFromTable() || 0;
    };

    // Первоначальный результат
    let currentResult = await getCurrentResult(currentPrice);
    updateStatus(`Старт: ${currentPrice} → ${currentResult} (Цель: ${target})`);

    // Проверка начального состояния
    if (Math.abs(currentResult - target) <= 50) {
        updateStatus(`Уже в допустимом диапазоне: ${currentResult}`);
        return;
    }

    // Определение направления поиска
    direction = currentResult < target ? 'up' : 'down';
    updateStatus(`Начинаем поиск в направлении: ${direction}`);

    // Экспоненциальный поиск границ
    while (iterations < 10 && Math.abs(currentResult - target) > 50) {
        iterations++;
        const prevPrice = currentPrice;
        currentPrice += direction === 'up' ? step : -step;
        
        currentResult = await getCurrentResult(currentPrice);
        updateStatus(`Шаг ${iterations}: ${prevPrice} → ${currentPrice} → ${currentResult}`);

        // Проверка пересечения цели
        if ((direction === 'up' && currentResult >= target) || 
            (direction === 'down' && currentResult <= target)) {
            break;
        }

        step *= 2;
    }

    // Бинарный поиск в найденном диапазоне
    let low = direction === 'up' ? currentPrice - step : currentPrice;
    let high = direction === 'up' ? currentPrice : currentPrice + step;
    updateStatus(`Уточнение в диапазоне: ${low} - ${high}`);

    while (iterations < 20 && low <= high) {
        iterations++;
        const mid = Math.round((low + high) / 2);
        currentResult = await getCurrentResult(mid);
        
        // Обновление лучшего результата
        const currentDiff = Math.abs(currentResult - target);
        if (currentDiff < bestDiff) {
            bestDiff = currentDiff;
            bestPrice = mid;
        }

        updateStatus(`Точная настройка: ${mid} → ${currentResult} (Осталось итераций: ${20 - iterations})`);

        if (currentDiff <= 50) break;
        if (currentResult < target) low = mid + 1;
        else high = mid - 1;
    }

    // Финализация результатов
    currentResult = await getCurrentResult(bestPrice);
    if (Math.abs(currentResult - target) <= 50) {
        updateStatus(`Успех: ${bestPrice} → ${currentResult} (Разница: ${currentResult - target})`);
    } else {
        updateStatus(`Лучший результат: ${bestPrice} → ${currentResult} (Отклонение: ${currentResult - target})`);
    }
});




https://calculator.ozon.ru/
Использую внедрение js для автоматизации рассчетов
Есть онлайн калькулятор ozon, нужно на страницу вверх добавить кнопку Рассчитать и инпут с ценой, а так же поле с выводом текущего статуса задачи
Калькулятор озона представляет из себя следующий функционал: 
при выборе товара создается рассчетная таблица с ценой, а так же есть поле в которое вводится значение новой цены. Когда значение в этом поле введено - появляется кнопка перерасчета и при нажатии относительно введенной цены идет перерасчет новой конечной цены. Конечное число считается примерно как начальное_значение - кике-то_рассчеты=конечное значение. 
Я написал 4 функции. 
getInputPrice() - получает элемент input в котором находится текущее число, с которого вычитается N значение озоном в процессе перерасчетов. В его value хранится текущее начальное значение
function editInputPrice(inputPrice, newPrice) - изменяет значение в этом поле, на вход принимает как раз тот объект input который возвращает getInputPrice(), а так же значение, которое нужно установить в этом поле
clickButtonNewPrice() - нажимает на кнопку перерасчета
getPriceFromTable() - получает конечное значение из таблицы перерасчетов от озона после перерасчета и возвращает его числом (может быть и отрицательным и положительным)

Необходимо реализовать следующий функционал:
Добавляем интерфейс - инпут с значением к которому стримимся и кнопка рассчитать 
Берем пересчитанное значение и таблицы и значение к которому стримимся. Значение к которому стримимся делим на значени, которое находится в таблице после пересчетов. Затем полученное число округляем и отправляем в начальный input price, нажимаем кнопку перерасчета
Пишем модуль от Полученного после перерасчетов числа - числа кк оторому стримимся
Все едйствия выполняем с ожиданием в пределах 1000 - 2000 мс, мои функции не переписываем и не меняем