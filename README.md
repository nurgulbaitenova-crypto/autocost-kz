# AutoCost

Одностраничный калькулятор реальной стоимости владения автомобилем в Казахстане.

## Запуск

Нужен Node.js 20.19+ и pnpm.

```bash
pnpm install
pnpm dev
```

Для production-сборки:

```bash
pnpm build
pnpm preview
```

Параметры расчёта хранятся в локальном хранилище браузера. Все оценки считаются на устройстве по введённым данным.

## Публикация на GitHub Pages

Workflow в `.github/workflows/deploy.yml` публикует сайт при каждом push в `main`. Репозиторий настроен для адреса `https://<владелец>.github.io/autocost-kz/`.
