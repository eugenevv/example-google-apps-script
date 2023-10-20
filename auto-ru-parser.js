var
    sheetRange = null
    ,parsePage = null
    ,sheetRangeValues = null
    ,sheetRangeValuesLength = null
    ,parserSetting = 'Parser setting'
    ,parserSettingRange = null
    ,settings = {}
;

function start() {
    var app = new App("https://docs.google.com/spreadsheets/d/1IzthrRem7YDBZ6lIvSwxjN3lpLPc8otuM7qa8FHV3hw/edit#gid=437601384");

    app.process();
}

function App(url) {
    this.spreadsheet = SpreadsheetApp.openByUrl(url);
    this.listing = new Listing(this);
}

App.prototype.getValueFromHtml = function (html,template, posBegin) {
    var poses = template.split('|');
    var posEnd = 0;
    var offset = 0;

    for (var i=0; i<poses.length; i++) {
        if (i == poses.length-1) {
            offset = 1;
            if (i > 0) {
                offset = poses[i-1].length;
            }
            posEnd = html.indexOf(poses[i], posBegin+offset);
            return {value: html.substring(posBegin+offset, posEnd), posEnd: posEnd};
        }
        else {
            offset = 1;
            if (i > 0) {
                offset = poses[i-1].length;
            }
            posBegin = html.indexOf(poses[i], posBegin+offset);
            if (posBegin == -1) {
                return null;
            }
        }
    }
    return null;
};

App.prototype.changeSelectorPath = function (template) {
    var poses = null;
    if (template.indexOf('#app') > -1) {
        template = template.replace(/\s/g,'');
        template = template.replace(/#app>/g,'');
        template = template.replace(/>/g,'|<');
        template = template.replace(/\./g,'|');
        poses = template.split('|');
        var newPoses = [];
        for (var i=0; i<poses.length; i++) {
            if (poses[i].indexOf('nth-child') > -1) {
                poses[i] = poses[i].replace(/nth\-child/g,'');
                poses[i] = poses[i].replace(/[\(\)]/g,'');

                var subLayers = poses[i].split(':');
                for (var j=0; j<subLayers[1]; j++) {
                    newPoses.push(subLayers[0]);
                }
            }
            else {
                newPoses.push(poses[i]);
            }
        }

        newPoses.push('>');
        newPoses.push('</');
        template = newPoses.join('|');
    }

    return template;
};

App.prototype.setValueToSheet = function (valueFromHtml, row, col) {
    this.currentSheet.getRange(row, col*1+1).setValue(valueFromHtml);
};

App.prototype.postHandling = function (value, sheet, col) {

    var postBegin = this.currentSheet.createTextFinder('VALUE-MODIFICATOR-BEGIN').findNext().getRow();
    var postEnd = this.currentSheet.createTextFinder('VALUE-MODIFICATOR-END').findNext().getRow();

    for (var i=postBegin; i<=postEnd; i++) {
        var template = this.currentSheet.getRange(i, col*1+1).getValues()[0][0];
        if (template.length == 0) {
            break;
        }
        if (template == 'trim') {
            value = value.replace(/\s/g,'');
        }
        if (template.indexOf('remove-') > -1) {
            var suffix = template.substr(7);
            value = value.replace(suffix,'');
        }
        if (template.indexOf('replace-') > -1) {
            var from = template.substr(8),
                to = '';

            if (from.indexOf('-to-') > -1) {
                to = template.substr(4);
            }

            var re = new RegExp('\\' + from);
            value = value.replace(re, to);
        }
    }

    return value;
};

App.prototype.isStop = function () {

    if (this.listing.sheet.createTextFinder('IS-STOP').findNext().offset(0, 1).getValue() == 1) {
        return true;
    }

    return false;
};

App.prototype.process = function () {


    this.listing.process();

    return;

    this.setting.process();

    if (this.setting.values.common.isStop) {
        return;
    }

    if (this.setting.values.common.currentSheet == 'carPage') {
        this.carPage.process();
    }
    else if (this.setting.values.common.currentSheet == 'pagination') {
        this.pagination.process();
    }
};

function SelectorPattern(listing) {
    this.listing = listing;
}

SelectorPattern.prototype.getValues = function () {

    if (!this.values) {
        this.row = this.listing.sheet.createTextFinder('SELECTOR-PATTERN').findNext().getRow();
        this.range = this.listing.sheet.getRange(this.listing.parserColumnBegin + this.row + ":" + this.listing.parserColumnEnd + this.row);
        this.values = this.range.getValues();
    }

    return this.values;
};

SelectorPattern.prototype.setDataFromBlocks = function (block) {
    var values = [];
    values[0] = [];
    var dataForSend = {};

    for (var col=0; col < this.getValues()[0].length; col++) {
        var valueObj = this.listing.app.getValueFromHtml(block, this.getValues()[0][col], 0);
        if (!valueObj) {
            break;
        }
        var valueFromHtml = valueObj.value;
        if (col == 0) { // Кузов
            dataForSend.bodyType = valueFromHtml;
        }
        else if (col == 1) { // Марка
            dataForSend.brand = valueFromHtml;
        }
        else if (col == 2) { // Цвет
            dataForSend.color = valueFromHtml;
        }
        else if (col == 3) { // Топливо
            dataForSend.fuelType = valueFromHtml;
        }
        else if (col == 4) { // Изображение
            dataForSend.imageUrl = valueFromHtml;
        }
        else if (col == 5) { // Год когда придумали модель
            dataForSend.modelDate = valueFromHtml;
        }
        else if (col == 6) { // Модель
            dataForSend.modelName = valueFromHtml;
        }
        else if (col == 7) { // Количество дверей
            dataForSend.numberOfDoors = valueFromHtml;
        }
        else if (col == 8) { // Год выпуска данного авто
            dataForSend.productionDate = valueFromHtml;
        }
        else if (col == 9) { //
        }
        else if (col == 10) { // КПП
            dataForSend.vehicleTransmission = valueFromHtml;
        }
        else if (col == 11) { //
        }
        else if (col == 12) { // Цена
            dataForSend.priceSum = valueFromHtml;
        }
        else if (col == 13) { // Валюта
            dataForSend.priceCurrency = valueFromHtml;
        }
        else if (col == 14) { // Подробнее
            dataForSend.moreUrl = valueFromHtml;
        }
        else if (col == 15) { //
        }
        else if (col == 16) { // Объём
            valueFromHtml = valueFromHtml.replace(/[^0-9\.]/g,'');
            dataForSend.engineDisplacement = valueFromHtml;
        }
        else if (col == 17) { // Л.С.
            valueFromHtml = valueFromHtml.split(' ')[0];
            dataForSend.enginePower = valueFromHtml;
        }
        else if (col == 18) { // Топливо
        }
        else if (col == 19) { // Пробег
            if (valueFromHtml == "Новая" || valueFromHtml == "Новый") {
                valueFromHtml = 0;
            }
            else {
                valueFromHtml = valueFromHtml.replace(/[^\d+]/g,'');
            }
            dataForSend.age = valueFromHtml;
        }
        else if (col == 20) { // Привод
            if (valueFromHtml.indexOf('передний') > -1) {
                valueFromHtml = 'передний';
            }
            else if (valueFromHtml.indexOf('задний') > -1) {
                valueFromHtml = 'задний';
            }
            else if (valueFromHtml.indexOf('полный') > -1) {
                valueFromHtml = 'полный';
            }
            else {
                valueFromHtml = '';
            }
            dataForSend.wheeleDrive = valueFromHtml;
        }


        values[0][col] = valueFromHtml;
        //this.sheet.getRange(this.currentRowRange.getValue(), col+1).setValue(valueFromHtml);
    } // for col

    dataForSend.sourceSite = 'auto.ru';
    dataForSend.currentCity = this.listing.parserResult.getBaseUrlValue().split('/')[3];

    this.dataForSend = dataForSend;
    this.dataForSheet = values;
};

SelectorPattern.prototype.getDataForSend = function () {
    return this.dataForSend;
};

SelectorPattern.prototype.getDataForSheet = function () {
    return this.dataForSheet;
};

function PostParamName(listing) {
    this.listing = listing;
}

PostParamName.prototype.getValues = function () {

    if (!this.values) {
        this.row = this.listing.sheet.createTextFinder('POST-PARAM-NAME').findNext().getRow();
        this.range = this.listing.sheet.getRange(this.listing.parserColumnBegin + this.row + ":" + this.listing.parserColumnEnd + this.row);
        this.values = this.range.getValues();
    }

    return this.values;
};

function ParserResult(listing) {
    this.listing = listing;
}

ParserResult.prototype.getFirstRow = function () {
    if (!this.firstRow) {
        this.firstRow = this.listing.sheet.createTextFinder('PARSER-RESULT').findNext().offset(1, 0).getRow();
    }

    return this.firstRow;
};

ParserResult.prototype.getPaginationStartRange = function () {
    if (!this.paginationStartRange) {
        this.paginationStartRange = this.listing.sheet.getRange('B'+this.listing.currentRow.getValue());
    }
    return this.paginationStartRange;
};

ParserResult.prototype.getPaginationStartValue = function () {
    if (!this.paginationStartValue) {
        this.paginationStartValue = this.getPaginationStartRange().getValue();
        if (this.listing.currentPage.getValue() > this.paginationStartValue) {
            this.paginationStartValue = this.listing.currentPage.getValue();
        }
    }

    return this.paginationStartValue;
};

ParserResult.prototype.getPaginationEndRange = function () {
    if (!this.paginationEndRange) {
        this.paginationEndRange = this.listing.sheet.getRange('C'+this.listing.currentRow.getValue());
    }
    return this.paginationEndRange;
};

ParserResult.prototype.getPaginationEndValue = function () {
    if (!this.paginationEndValue) {
        this.paginationEndValue = this.getPaginationEndRange().getValue();
        if (this.paginationEndValue.length == 0) {
            this.paginationEndValue = 99;
        }
    }

    return this.paginationEndValue;
};

ParserResult.prototype.getBaseUrlRange = function () {
    if (!this.baseUrlRange) {
        this.baseUrlRange = this.listing.sheet.getRange('D'+this.listing.currentRow.getValue());
    }

    return this.baseUrlRange;
};

ParserResult.prototype.getBaseUrlValue = function () {
    if (!this.baseUrlValue) {
        this.baseUrlValue = this.getBaseUrlRange().getValue();
    }
    // дошли до последней строки внизу
    if (this.baseUrlValue.length == 0) {
        this.listing.currentRow.setValue(this.getFirstRow());
        this.listing.rowTimeEnd.setTimeValue(Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"));
        this.listing.currentPage.setValue(1);
        this.listing.currentItem.setValue(1);
        this.baseUrlRange=null;
        this.baseUrlValue = this.getBaseUrlRange().getValue();
    }


    return this.baseUrlValue;
};

ParserResult.prototype.setBaseUrlValue = function (value) {
    this.baseUrlValue = value;
    this.getBaseUrlRange().setValue(this.baseUrlValue);
};

function CurrentRow(listing) {
    this.listing = listing;
}

CurrentRow.prototype.getRange = function () {
    if (!this.range) {
        this.range = this.listing.sheet.createTextFinder('CURRENT-ROW').findNext().offset(0, 1);
    }
    return this.range;
};

CurrentRow.prototype.getValue = function () {
    if (!this.value) {
        this.value = this.getRange().getValue();
    }
    if (this.value.length == 0) {
        this.value = this.parserResult.getRow();
        this.setValue(this.value);
    }

    return this.value;
};

CurrentRow.prototype.setValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.value = value;
    this.getRange().setValue(this.value);
};

function RowTimeEnd(listing) {
    this.listing = listing;
}

RowTimeEnd.prototype.getRange = function () {
    if (!this.range) {
        this.range = this.listing.sheet.createTextFinder('ROW-TIME-END').findNext();
    }
    return this.range;
};

RowTimeEnd.prototype.getTimeRange = function () {
    if (!this.timeRange) {
        this.timeRange = this.getRange().offset(0, 1);
    }
    return this.timeRange;
};

RowTimeEnd.prototype.getDiffRange = function () {
    if (!this.diffRange) {
        this.diffRange = this.getRange().offset(0, 2);
    }
    return this.diffRange;
};

RowTimeEnd.prototype.getTimeValue = function () {
    if (!this.timeValue) {
        this.timeValue = this.getTimeRange().getValue();
    }
    if (this.timeValue.length == 0) {
        this.timeValue = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
        this.setTimeValue(this.timeValue);
    }

    return this.timeValue;
};

RowTimeEnd.prototype.getDiffValue = function () {
    if (!this.diffValue) {
        this.diffValue = this.getDiffRange().getValue();
    }

    return this.diffValue;
};

RowTimeEnd.prototype.setTimeValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.timeValue = value;
    this.getTimeRange().setValue(this.timeValue);
};

RowTimeEnd.prototype.setDiffValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.diffValue = value;
    this.getDiffRange().setValue(this.diffValue);
};

RowTimeEnd.prototype.isSmallDiff = function () {
    var diff = (new Date() - new Date(this.getTimeValue())) / 1000;
    this.setDiffValue(diff);
    if (diff < 60) {
        return true;
    }

    return false;
};

function CurrentPage(listing) {
    this.listing = listing;
}

CurrentPage.prototype.getRange = function () {
    if (!this.range) {
        this.range = this.listing.sheet.createTextFinder('CURRENT-PAGE').findNext().offset(0, 1);
    }
    return this.range;
};

CurrentPage.prototype.getValue = function () {
    if (!this.value) {
        this.value = this.getRange().getValue();
    }
    if (this.value.length == 0) {
        this.value = 1;
        this.setValue(this.value);
    }

    return this.value;
};

CurrentPage.prototype.setValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.value = value;
    this.getRange().setValue(this.value);
};

function CurrentItem(listing) {
    this.listing = listing;
}

CurrentItem.prototype.getRange = function () {
    if (!this.range) {
        this.range = this.listing.sheet.createTextFinder('CURRENT-ITEM').findNext().offset(0, 1);
    }
    return this.range;
};

CurrentItem.prototype.getValue = function () {
    if (!this.value) {
        this.value = this.getRange().getValue();
    }
    if (this.value.length == 0) {
        this.value = 1;
        this.setValue(this.value);
    }

    return this.value;
};

CurrentItem.prototype.setValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.value = value;
    this.getRange().setValue(this.value);
};

//PAGINATION-GET-PARAM

function PaginationGetParam (listing) {
    this.listing = listing;
}

PaginationGetParam.prototype.getRange = function () {
    if (!this.range) {
        this.range = this.listing.sheet.createTextFinder('PAGINATION-GET-PARAM').findNext().offset(0, 1);
    }
    return this.range;
};

PaginationGetParam.prototype.getValue = function () {
    if (!this.value) {
        this.value = this.getRange().getValue();
    }
    if (this.value.length == 0) {
        this.value = 1;
        this.setValue(this.value);
    }

    return this.value;
};

PaginationGetParam.prototype.setValue = function (value) {
    if (this.value === value) {
        return;
    }
    this.value = value;
    this.getRange().setValue(this.value);
};

function Parser () {
    this.contentText = '';
    this.separator = '';
    this.blocks = [];
}

Parser.prototype.setContentTextFromUrl = function (url) {
    this.contentText = UrlFetchApp.fetch(url).getContentText();
};

Parser.prototype.setBlocksBySeparator = function (separator) {
    this.separator = separator;
    this.blocks = this.contentText.split(separator);
};

Parser.prototype.getBlocks = function () {
    return this.blocks;
};

Parser.prototype.isEndPagination = function () {
    if (this.blocks.length == 0 || this.blocks.length == 1 && this.blocks.indexOf(this.separator)) {
        return true;
    }

    return false;
};

function Listing(app) {
    this.app = app;
    this.sheet = this.app.spreadsheet.getSheetByName('ListingParser');
    this.parserColumnBegin = 'E';
    this.parserColumnEnd = 'Y';
    this.selectorPattern = new SelectorPattern(this);
    this.parserResult = new ParserResult(this);
    this.currentRow = new CurrentRow(this);
    this.rowTimeEnd = new RowTimeEnd(this);
    this.currentPage = new CurrentPage(this);
    this.currentItem = new CurrentItem(this);
    this.paginationGetParam = new PaginationGetParam(this);
    this.parser = new Parser(this);
}

Listing.prototype.getValue = function (name) {
    return this.sheet.createTextFinder(name).findNext().getNextDataCell(SpreadsheetApp.Direction.NEXT).getValue();
};

Listing.prototype.init = function () {
    if (this.rowTimeEnd.isSmallDiff()) {
        return;
    }

    this.rowTimeEnd.setTimeValue(Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"));
};

Listing.prototype.process = function () {

    this.init();

    while (1) {
        if (this.app.isStop()) {
            return;
        }

        //100
        var valueObj = null;
        var posEnd = 0;
        var paginationStartValue = this.parserResult.getPaginationStartValue();
        var paginationEndValue = this.parserResult.getPaginationEndValue();
        for (var index = paginationStartValue; index <= paginationEndValue; index++) {
            if (this.app.isStop()) {
                return;
            }
            this.currentPage.setValue(index);
            var url = this.parserResult.getBaseUrlValue() + '&' + this.paginationGetParam.getValue() + '=' + index;
            this.parser.setContentTextFromUrl(url);
            this.parser.setBlocksBySeparator('ListingItem-module__container');

            if (this.parser.isEndPagination()) {
                this.currentPage.setValue(1);
                this.currentRow.setValue(this.currentRow.getValue()+1);
                break;
            }

            for (var i=1; i<this.parser.getBlocks().length; i++) {
                if (i < this.currentItem.getValue()) {
                    continue;
                }
                this.currentItem.setValue(i);

                this.selectorPattern.setDataFromBlocks(this.parser.getBlocks()[i]);

                var currentRowValue = this.currentRow.getValue();
                var v = this.parserColumnBegin + currentRowValue + ":" + this.parserColumnEnd + currentRowValue;
                Logger.log(this.selectorPattern.getDataForSheet()); return;
                this.sheet.getRange(v).setValues(this.selectorPattern.getDataForSheet());
                this.sendToAcr(this.selectorPattern.getDataForSend());
            } // for i

            if (
                index == paginationEndValue
            ) {
                this.currentPageRange.setValue(1);
                this.currentRowRange.setValue(this.currentRowRange.getValue() + 1);
            }
            else {
                this.currentPageRange.setValue(this.currentPageRange.getValue() + 1);
            }
            this.currentItemRange.setValue(1);

            this.rowTimeEndRange.offset(0, 1).setValue(Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"));
            this.rowTimeEndRange.offset(0, 2).setValue(parseInt((new Date() - new Date(this.rowTimeEndValue))/1000));

            var b = 1;
            //return;
        }
    }
};

Listing.prototype.sendToAcr = function(data)
{
    var responseImg = null;
    try {
        responseImg = UrlFetchApp.fetch(data.imageUrl);
    }
    catch (e) {
        return;
    }

    var blob = responseImg.getBlob();
    //var bytes = blob.getBytes();
    //var base64String = Utilities.base64Encode(bytes);

    Logger.log(blob.getContentType());
    Logger.log(blob.getName());


    var boundary = "asdfdhdsjioafhaiosd";

    //var attributes = "{\"model\":\"TOYOTA\", \"arr\":{\"id\":1}}";
    var attributes = JSON.stringify(data);

    var requestBody = Utilities.newBlob(
        "--"+boundary+"\r\n"
        + "Content-Disposition: form-data; name=\"attributes\"\r\n\r\n"
        + attributes+"\r\n"+"--"+boundary+"\r\n"
        + "Content-Disposition: form-data; name=\"file\"; filename=\""+blob.getName()+"\"\r\n"
        + "Content-Type: " + blob.getContentType()+"\r\n\r\n").getBytes()
        .concat(blob.getBytes())
        .concat(Utilities.newBlob("\r\n--"+boundary+"--\r\n").getBytes());

    var options = {
        method: "post"
        , contentType: "multipart/form-data; boundary="+boundary
        , payload: requestBody
        , muteHttpExceptions: true
        //headers: {'Authorization': 'Bearer ' + getBoxService_().getAccessToken()}
    };

    var responseAcr = UrlFetchApp.fetch("http://2.59.40.14/v1/car/index", options);
    Logger.log(responseAcr);
}

function Setting(app) {
    this.app = app;
    this.range = this.app.spreadsheet.getSheetByName('parserSetting').getRange('A2:C');
    this.setValues();
}

Setting.prototype.setValues = function () {
    this.values = {};
    for (i=0; i<this.range.getValues().length; i++) {
        if (this.range.getValues()[i][0] == '') {
            break;
        }
        if (!this.values[this.range.getValues()[i][0]]) {
            this.values[this.range.getValues()[i][0]] = {};
        }
        this.values[this.range.getValues()[i][0]][this.range.getValues()[i][1]] = this.range.getValues()[i][2];
        this.values[this.range.getValues()[i][0]]['previousIndexRaw'] = i+1;
    }
};

Setting.prototype.process = function () {
    this.range = this.app.spreadsheet.getSheetByName('parserSetting').getRange('A2:C');
    this.setValues();
};

Setting.prototype.setPreviousIndex = function (sheet, index) {
    /*var currenSheetName = this.app.spreadsheet.createTextFinder('currentSheet')
      .startFrom(
        this.app.spreadsheet.createTextFinder('common')
        .findNext()
      ).findNext().getNextDataCell(SpreadsheetApp.Direction.NEXT).getValues();*/

    this.app.spreadsheet.createTextFinder('previousIndex')
        .startFrom(
            this.app.spreadsheet.createTextFinder(sheet)
                .findNext()
        ).findNext().getNextDataCell(SpreadsheetApp.Direction.NEXT).setValue(index);
};

Setting.prototype.changeSheet = function (nextSheet) {
    this.app.spreadsheet.createTextFinder('currentSheet')
        .startFrom(
            this.app.spreadsheet.createTextFinder('common')
                .findNext()
        ).findNext().getNextDataCell(SpreadsheetApp.Direction.NEXT).setValue(nextSheet);
};

Setting.prototype.setIsStop = function (value) {
    this.app.spreadsheet.createTextFinder('isStop')
        .startFrom(
            this.app.spreadsheet.createTextFinder('common')
                .findNext()
        ).findNext().getNextDataCell(SpreadsheetApp.Direction.NEXT).setValue(value);
};

function CarPage(app) {
    this.app = app;
}

CarPage.prototype.init = function () {
    this.previousIndex = this.app.setting.values.carPage.previousIndex;
    this.currentIndex = this.previousIndex + 1;
    this.app.currentSheet = this.app.spreadsheet.getSheetByName('carPage');
    this.range = this.app.currentSheet.getRange('A' + this.currentIndex + ':A' + this.currentIndex),
        this.modificatedRange = this.app.currentSheet.createTextFinder('SELECTOR-MODIFICATED').findNext();

    var sourceFinder = this.app.currentSheet.createTextFinder('SELECTOR-SOURCE'),
        sourceRange = sourceFinder.findNext(),
        sourceRow = sourceRange.getRow(),
        modificatedRow = this.modificatedRange.getRow();

    for (var i=1, sourceValue = sourceRange.offset(0, i).getValue(); sourceValue.length > 0; i++, sourceValue = sourceRange.offset(0, i).getValue()) {
        var modificatedRange = this.modificatedRange.offset(0, i),
            modificatedOldValue = modificatedRange.getValue();
        if (modificatedOldValue.length == 0) {
            var modificatedNewValue = this.app.changeSelectorPath(sourceValue);
            modificatedRange.setValue(modificatedNewValue);
        }
    }

    //this.template = this.app.currentSheet.getRange('A' + modificatedRow + ':Z' + modificatedRow).getValues();
};

CarPage.prototype.process = function () {

    if (this.app.setting.values.common.isStop) {
        return;
    }

    this.init();

    if (this.app.setting.values.common.isStop) {
        return;
    }

    var url = this.app.currentSheet.getRange('A' + this.currentIndex).getValue();
    if (!url.length) {
        this.app.setting.changeSheet('pagination');
        this.app.process();
        return;
    }

    var html = UrlFetchApp.fetch(url).getContentText();

    for (var col=1, tpl = this.modificatedRange.offset(0, col).getValue(); tpl.length > 0; col++, tpl = this.modificatedRange.offset(0, col).getValue()) {

        if (col == 12) {
            var b =1;
        }

        var valueFromHtml = this.app.getValueFromHtml(html, tpl);

        valueFromHtml = this.app.postHandling(valueFromHtml, this.app.currentSheet, col);

        // Цена
        // Если пусто, то продан
        if (col == 1) {
            if (valueFromHtml.length == 0) {valueFromHtml = 'Продан'}
            this.app.setValueToSheet(valueFromHtml, this.currentIndex*1, col);
        }
            // Двигатель G 1.6 л / 115 л.с. / Бензин
        // Двигатель мощьность 115 л.с.
        else if (col == 6) {
            this.app.setValueToSheet(valueFromHtml.split('/')[0].replace(/[^\d+\.]/g,''), this.currentIndex*1, col);
        }
            // Двигатель G 1.6 л / 115 л.с. / Бензин
        // Двигатель мощьность 115 л.с.
        else if (col == 7) {
            this.app.setValueToSheet(valueFromHtml.split('/')[1].replace(/[^\d+]/g,''), this.currentIndex*1, col);
        }
            // Двигатель G 1.6 л / 115 л.с. / Бензин
        // Двигатель топливо Бензин
        else if (col == 8) {
            this.app.setValueToSheet(valueFromHtml.split('/')[2].trim(), this.currentIndex*1, col);
        }
        //Налог
        else if (col == 9) {
            this.app.setValueToSheet(valueFromHtml.replace(/[^\d+]/g,''), this.currentIndex*1, col);
        }
        //Картинки
        else if (col >= 20 && col < 35) {
            this.app.setValueToSheet(valueFromHtml.replace(/\/small/g,'/1200x900n').replace(/\/\/auto\.ru/g,'https://auto.ru').replace(/\/\/avatars/g,'https://avatars'), this.currentIndex*1, col);
        }
        else {
            this.app.setValueToSheet(valueFromHtml, this.currentIndex*1, col);
        }


        if (col == 20) { //Владение
            this.app.setting.setIsStop(1);
            return;
        }
    }

    this.app.setting.setPreviousIndex('carPage', this.currentIndex);
    this.app.process();
};

function Pagination(app) {
    this.app = app;
}

Pagination.prototype.process = function () {

    if (this.app.setting.values.common.isStop) {
        return;
    }

    this.init();

    if (this.app.setting.values.common.isStop) {
        return;
    }

    var url = this.range.getValues()[0][0];
    if (!url.length) {
        this.app.setting.changeSheet('CarPage');
        this.app.process();
        return;
    }

    var html = UrlFetchApp.fetch(url).getContentText();

    for (var col in this.template[0]) {
        if (col == 0) {
            continue;
        }

        if (this.template[0][col].length == 0) {
            continue;
        }

        var valueFromHtml = this.app.getValueFromHtml(html, this.template[0][col]);
        this.app.setValueToSheet(valueFromHtml, this.currentIndex*1, col);
    }

    this.app.setting.setpreviousIndex('pagination', this.currentIndex);
    this.app.process();
};

Pagination.prototype.init = function () {
    this.previousIndex = this.app.setting.values.pagination.previousIndex;
    this.currentIndex = this.previousIndex + 1;
    this.app.currentSheet = this.app.spreadsheet.getSheetByName('pagination');
    this.range = this.app.currentSheet.getRange('A' + this.currentIndex + ':A' + this.currentIndex);
    var textFinder = this.app.spreadsheet.createTextFinder('SELECTOR-MODIFICATED');
    this.templateRowNumber = textFinder.findNext().getRow();
    this.template = this.app.currentSheet.getRange('A' + this.templateRowNumber + ':Z' + this.templateRowNumber).getValues();
};

function getSettings(parserSettingRange) {
    var settings = {};
    for (i=0; i<parserSettingRange.getValues().length; i++) {
        if (parserSettingRange.getValues()[i][0] == '') {
            break;
        }
        if (!settings[parserSettingRange.getValues()[i][0]]) {
            settings[parserSettingRange.getValues()[i][0]] = {};
        }
        settings[parserSettingRange.getValues()[i][0]][parserSettingRange.getValues()[i][1]] = parserSettingRange.getValues()[i][2];
        settings[parserSettingRange.getValues()[i][0]]['previousIndexRaw'] = i+1;
    }

    return settings;
}

function getValue(html,template) {
    var poses = template.split('|');
    var posBegin = 0;
    var posEnd = 0;
    for (var i=0; i<poses.length; i++) {
        if (i == poses.length-1) {
            posEnd = html.indexOf(poses[i],posBegin+1);
            return html.substring(posBegin+poses[i-1].length, posEnd);
        }
        else {
            posBegin = html.indexOf(poses[i],posBegin+1);
        }
    }
    return '';
}

function getElementById(element, idToFind) {
    var descendants = element.getDescendants();
    for(i in descendants) {
        var elt = descendants[i].asElement();
        if( elt !=null) {
            var id = elt.getAttribute('id');
            if( id !=null && id.getValue()== idToFind) return elt;
        }
    }
}

function getElementsByClassName(element, classToFind) {
    var data = [];
    var descendants = element.getDescendants();
    descendants.push(element);
    for(i in descendants) {
        var elt = descendants[i].asElement();
        if(elt != null) {
            var classes = elt.getAttribute('class');
            if(classes != null) {
                classes = classes.getValue();
                if(classes == classToFind) data.push(elt);
                else {
                    classes = classes.split(' ');
                    for(j in classes) {
                        if(classes[j] == classToFind) {
                            data.push(elt);
                            break;
                        }
                    }
                }
            }
        }
    }
    return data;
}

function getElementsByTagName(element, tagName) {
    var data = [];
    var descendants = element.getDescendants();
    for(i in descendants) {
        var elt = descendants[i].asElement();
        if( elt !=null && elt.getName()== tagName) data.push(elt);
    }
    return data;
}


//Array.from(document.getElementsByClassName('Link CarPageItemThumb')).forEach(function (el) {console.log(el.getAttribute('href'))})
//https://auto.ru/cars/used/sale/toyota/caldina/1093469290-7c3651c7/?sort=fresh_relevance_1-desc

function getCell(url, sheetName, range, notEmptyRange) {
    var value = null;

    if (!url) {
        return value;
    }

    value = SpreadsheetApp
        .openByUrl(url);

    if (sheetName) {
        value = value
            .getSheetByName(sheetName);
    }

    if (range) {
        value = value
            .getRange(range);

        if (notEmptyRange) {
            value = value.getValues();
        }
    }

    return value;
}

function setCellValue(spreadsheet, sheetName, columnName, rowNumber, value) {
    spreadsheet.getSheetByName(sheetName).getRange(columnName + rowNumber + ":" + columnName + rowNumber).setValue(value);
}

function setCellBackground(spreadsheet, sheetName, columnName, rowNumber, value) {
    spreadsheet.getSheetByName(sheetName).getRange(columnName + rowNumber + ":" + columnName + rowNumber).setBackground(value);
}
