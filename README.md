Техническое задание для разработки торгового бота под Binance Futures на node.js

1. Введение

    Цель данного технического задания - описание требований и ограничений для разработки торгового бота для работы на Binance Futures. Бот должен быть способен интерпретировать входящие POST реквесты от Trading View и выполнять соответствующие действия на бирже Binance Futures.

2. Требования к функционалу

    1. Обработка входящих POST реквестов

        Бот должен уметь обрабатывать входящие POST реквесты от Trading View. Текст каждого реквеста представляет собой следующую структуру:

        [биржа] [пара] [таймфрейм] [индикатор] [значение]

        Где:

        * [биржа] - название биржи, в данном случае Binance. Бот должен быть способен к расширению на работу с другими биржами в будущем.

        * [пара] - название торговой пары. Бот должен поддерживать возможность добавления неограниченного количества торговых пар.

        * [таймфрейм] - временной интервал, на котором производится анализ.

        * [индикатор] - тип индикатора, по которому принимается решение о совершении сделки. Возможные значения: SI (сигналы на покупку/продажу), TR (уровень тренда), MA (скользящая средняя).

        * [значение] - значение индикатора.

        Примеры: 

        "BINANCE MATICUSDT 1h SI BUY"

        "BINANCE BTCUSDT 1d TR -0.21"

        "BINANCE SOLUSDT 2h MA 20.01"

    2. Правила торговли

        Бот должен следовать определенным правилам торговли, описанным ниже.

        Открытие позиций:

        * Если приходит сигнал BUY, бот должен открывать лонг позицию, выставлять стоплосс и тейкпрофит.

        * Если приходит сигнал SELL, бот должен открывать шорт позицию, выставлять стоплосс и тейкпрофит.

        Открытие позиций происходит только при соблюдении следующих условий:

        * Сигнал противоположен направлению тренда 1d.

        * Сигнал совпадает с направлением локального тренда, в том числе по всем старшим таймфреймам (кроме 1d).

        * Текущая цена отличается от последней скользящей средней того же таймфрейма не более чем на 3%.

        * Индикатор не перегрет (за последние 20 тиков включая текущий было получено максимум 2 buy/sell сигнала).

        * Еще нет открытых позиций по данной торговой паре.

        Определение размера позиции:

        * Размер позиции должен расчитываться таким образом, чтобы каждая новая позиция снижала баланс на 1/10 от суммы заданного банка.

        Тип маржи:

        * Сделки осуществляются только с изолированной маржой.

        Выход из позиций:

        * Выход из сделки происходит при получении обратного сигнала с того же таймфрейма, с которого была открыта позиция, либо по тейкпрофиту или стоплоссу. Такие ситуации тоже должны отлавливаться и логироваться. При выходе из позиции должны быть также закрыты все ордера связаные с конкретно этой позицией, в том числе тейкпрофит и стоплосс ордера

        Установка плеча:

        * Плечо зависит от таймфрейма, на котором был получен сигнал:

            * 4h - x5

            * 3h - x7

            * 2h - x9

            * 1h - x10

        Установка стоп-лосса и тейк-профита:

        * Стоп-лосс и тейк-профит должны устанавливаться по следующим формулам, в зависимости от направления сделки:

        Формула определения стоплосса:

        (price - цена при открытии сделки, leverage - плечо): 

        priceDiff = 0.2 * price / leverage;

        Для лонгов:

        stopLossPrice = price - priceDiff;

        Для шортов:

        stopLossPrice = price + priceDiff;

        Формула определения тейкпрофита:

        priceDiff = 0.1 * price / leverage;

        Для лонгов:

        takeProfitPrice = price + priceDiff;

        Для шортов:

        takeProfitPrice = price - priceDiff;

    3. Логирование

        В боте должна быть предусмотрена система логирования, которая отслеживает все действия бота и записывает их в консоль. Также должны быть созданы два файла для хранения истории открытых и закрытых позиций. Должно присутствовать как минимум 3 лог файла (по желанию исполнителя может быть больше и с большим количеством данных):

        1) Список открытых позиций (Дата, биржа, пара, направление (Лонг, Шорт), таймфрейм, цена входа, цена стоп лосса, цена тейк профита, плечо, статус (Открыта, Закрыта).

        2) История всех закрытых позиций (Дата, биржа, пара, направление (Лонг, Шорт), таймфрейм, цена входа, цена выхода, плечо, причина выхода (Обратынй сигнал, Стоплосс, Тейкпрофит)

        3) Лог ошибок

3. Требования к использованию библиотек

    Для реализации требуемого функционала можно использовать библиотеку 'node-binance-api'. Использование других библиотек должно быть согласовано из соображений безопасности.

4. Общие требования к коду

    Код пишется на Node JS. Код должен быть структурирован, читаем и отвечать стандартам качества кода на языке JavaScript. Не должно быть минифицированых версий и подключений к сторонним источникам. Хранение данных - noSQL Redis.

5. Обработка ошибок и исключительных ситуаций

    Все возможные баги должны быть отлажены, на выходе должен быть продукт, который работает стабильно, без ошибок и сбоев.

    В случае, если нет ответа от биржи при попытке закрытия/открытия позиции, бот должен отправлять запросы повторно с увеличивающимися интервалами. Если бот, не может открыть позицию - он пробует максимум в течении 5 минут. Если бот не может закрыть позицию - он пробует без лимита по времени, новые сигналы по этой монете игнорируются, пока позиция не будет закрыта. Все такие ошибки должны логироваться.

6. Отладка и тестирование

    Исполнитель производит отладку и тестирование продукта собственными силами, на собственном аккаунте Binance.

7. Требования к документации

    Документация должна включать в себя подробную инструкцию о том, как установить и настроить бота на сервере на windows с графическим интерфейсом пользователя, о минимальных технических характеристиках данного сервера, информацию по запуску и использовании бота, а также описание всех возможных сообщений об ошибках и способов их устранения. Также, на случай, если в будущем потребуется внесение изменений или добавление новых функций, должны быть прописаны процедуры обновления бота и возможные ограничения в этом процессе.
