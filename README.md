# Сервис генерации pdf-документов

Сервис генерирует pdf-документы на основе html-документа, полученного одним из следующих способов:

* непосредственно текст html-документа
* полный URL html-документа
* pug-шаблон, на основе которого генерируется html-документ

## Запуск сервиса

Для своей работы сервис использует браузер Chrome, запущенный в headless режиме. Для запуска Chrome можно воспользоваться, например, [docker-образом](https://hub.docker.com/r/ttonyh/chrome-headless-stable)

Для запуска сервиса в автономном режиме проще всего использовать docker-compose.

docker-compose.yml:
```yaml
version: "3"
services:
  chrome:
    image: yukinying/chrome-headless
    container_name: chrome
    networks:
      - net
  html2pdf:
    image: alexd1971/html2pdf
    container_name: html2pdf
    depends_on:
      - chrome
    networks:
      - net
    ports:
      - 7777:7777
    volumes:
      - ./config.json:/app/config.json
      - /path/to/templates:/app/templates
networks:
  net:
    driver: bridge
```

Сервис может быть легко интегрирован в любое приложение с микросервисной архитектурой. Организация запуска должна быть выполнена таким образом, чтобы было возможно необходимое сетевое взаимодействие между микросервисами приложения.

## Шаблоны

На данный момент допускаются только шаблоны в формате шаблонизатора [pug](https://pugjs.org).

Сами шаблоны необходимо размещать в каталоге `templates`, выделяя для шаблона каждого документа отделный каталог. Главный файл шаблона должен иметь имя index.pug. Имя документа для генерации pdf-файла определяется именем каталога с файлом index.pug.

Поскольку шаблон документа читается непосредственно перед генерацией pdf-документа, шаблоны можно закгружать в каталог шаблонов как вручную, так и посредством внешнего приложения без необходимости перезапуска сервиса.

## Генерация pdf-документа

Для генерации pdf-документа необходимо отправить сервису `POST`-запрос следующего формата:

```
Content-Type: application/json
```
```json
{
  "doctype": "pug",
  "document": "document_name",
  "vars": {
    "title": "Заголовок документа",
    "value": "значение какого-либо поля документа",
    ...
  },
  "printOptions": {
    "pageRanges": "1",
  }
}
```
`doctype` (обязательный параметр) - тип документа. Возможны варианты:

* `'html'` - html-документ,
* `'pug'` - документ-шаблон для шаблонизатора pug (шаблон заранее должен быть размещен в каталоге с шаблонами),
* `'url'` - URL HTML-документа
  
`document` (обязательный параметр):

* для типа документа `html`  содержит текст html
* для типа документа `pug` содержит имя катлога шаблона с файлом `index.pug`
* для типа документа `url`  содержит полный URL html-документа

`vars` - значения переменных шаблона (не обязательно)

`printOptions` - парамтеры печати (не обязательно)

Допустимые `printOptions`:

* `landscape`: boolean
* `marginTop`: num
* `marginBottom`: num
* `marginLeft`: num
* `marginRight`: num
* `includeBackground`: boolean
* `paperWidth`: num
* `paperHeight`: num
* `pageRanges`: string (Например: `"1"` или `"2-4,6-8"`)
* `scale`: num (диапазон допустимых значений: 0.1 - 2)
* `displayHeaderFooter`: boolean
* `headerTemplate`: string (html-шаблон)
* `footerTemplate`: string (html-шаблон)

При создании html-шаблонов `headerTemplate` и `footerTemplate` можно использовать следующие предопределённые классы:

* `date` (дата формирования документа)
* `title` (title html-документа)
* `url` (размещение документа)
* `pageNumber` (номаер текущей страницы)
* `totalPages` (всего страниц)

Так же нужно учитывать, что к шаблонам `headerTemplate` и `footerTemplate` применяются следующие стили:

```css
<style>
  body {
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  #header, #footer {
    display: flex;
    flex: none;
  }

  #header {
    align-items: flex-start;
    padding-top: 0.4cm;
  }

  #footer {
    align-items: flex-end;
    padding-bottom: 0.4cm;
  }

  #content {
    flex: auto;
  }

  .left {
    flex: none;
    padding-left: 0.7cm;
    padding-right: 0.1cm;
  }

  .center {
    flex: auto;
    padding-left: 0.7cm;
    padding-right: 0.7cm;
    text-align: center;
  }

  .right {
    flex: none;
    /* historically does not account for RTL */
    padding-left: 0.1cm;
    padding-right: 0.7cm;
  }

  .grow {
    flex: auto;
  }

  .text {
    font-size: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
```

При этом то, что прописано в `headerTemplate` автоматически оборачивается в

```html
<div id="header">...</div>
```

Аналогино то, что прописано в `footerTemplate` автоматически оборачивается в

```html
<div id="footer">...</div>
```

Пример шаблона:

```html
<div class="text center">
  Page <span class="pageNumber"></span> of <span class="totalPages"></span>
</div>
```
В случае успешной генерации pdf-документа сервис отвечает:
```
HTTP 200 OK
Content-type: application/pdf
```
В теле ответа находится содержимое pdf-файла, которое можно сохранить на диск или передать дальше.
