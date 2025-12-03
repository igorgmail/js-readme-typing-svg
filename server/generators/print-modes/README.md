# Print Modes

Эта директория содержит различные режимы анимации появления (печати) текста.

## Структура

Каждый режим печати должен наследоваться от базового класса `PrintMode` и реализовывать метод `calculateAnimation`.

## Планируемые режимы

### TypewriterPrintMode
Классический эффект печатающей машинки - символы появляются последовательно.

### WordPrintMode
Текст печатается слово за словом вместо символа за символом.

### InstantPrintMode
Мгновенное появление текста без анимации.

### FadeInPrintMode
Текст появляется через постепенное увеличение прозрачности.

## Как добавить новый режим

1. Создайте новый файл с именем режима, например `TypewriterPrintMode.js`
2. Импортируйте базовый класс `PrintMode`
3. Создайте класс, наследующийся от `PrintMode`
4. Реализуйте метод `calculateAnimation(config)`
5. Зарегистрируйте режим в `index.js`

### Пример

```javascript
import { PrintMode } from './PrintMode.js';

export class TypewriterPrintMode extends PrintMode {
  calculateAnimation(config) {
    // Ваша логика вычисления параметров анимации
    return {
      // параметры анимации
    };
  }
}
```

