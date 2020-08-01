var dynamicSelection = (function () {
    "use strict";
    var util = {
        /**********************************************************************************
         ** required functions 
         *********************************************************************************/
        featureInfo: {
            name: "APEX Dynamic Selection",
            info: {
                scriptVersion: "1.0.1",
                utilVersion: "1.3.5",
                url: "https://github.com/RonnyWeiss",
                license: "MIT"
            }
        },
        isDefinedAndNotNull: function (pInput) {
            if (typeof pInput !== "undefined" && pInput !== null && pInput != "") {
                return true;
            } else {
                return false;
            }
        },
        isAPEX: function () {
            if (typeof (apex) !== 'undefined') {
                return true;
            } else {
                return false;
            }
        },
        varType: function (pObj) {
            if (typeof pObj === "object") {
                var arrayConstructor = [].constructor;
                var objectConstructor = ({}).constructor;
                if (pObj.constructor === arrayConstructor) {
                    return "array";
                }
                if (pObj.constructor === objectConstructor) {
                    return "json";
                }
            } else {
                return typeof pObj;
            }
        },
        debug: {
            info: function () {
                if (util.isAPEX()) {
                    var i = 0;
                    var arr = [];
                    for (var prop in arguments) {
                        arr[i] = arguments[prop];
                        i++;
                    }
                    arr.push(util.featureInfo);
                    apex.debug.info.apply(this, arr);
                }
            },
            error: function () {
                var i = 0;
                var arr = [];
                for (var prop in arguments) {
                    arr[i] = arguments[prop];
                    i++;
                }
                arr.push(util.featureInfo);
                if (util.isAPEX()) {
                    apex.debug.error.apply(this, arr);
                } else {
                    console.error.apply(this, arr);
                }
            }
        },
        /**********************************************************************************
         ** optinal functions 
         *********************************************************************************/
        setItemValue: function (itemName, value) {
            if (util.isAPEX()) {
                if (apex.item(itemName) && apex.item(itemName).node != false) {
                    apex.item(itemName).setValue(value);
                } else {
                    util.debug.error("Please choose a set item. Because the value (" + value + ") can not be set on item (" + itemName + ")");
                }
            } else {
                util.debug.error("Error while try to call apex.item");
            }
        },
        getItemValue: function (itemName) {
            if (!itemName) {
                return "";
            }

            if (util.isAPEX()) {
                if (apex.item(itemName) && apex.item(itemName).node != false) {
                    return apex.item(itemName).getValue();
                } else {
                    util.debug.error("Please choose a get item. Because the value could not be get from item(" + itemName + ")");
                }
            } else {
                util.debug.error("Error while try to call apex.item");
            }
        },
        removeElementFromArray: function (pArr, pSrcStr) {
            if (util.varType(pArr)) {
                if (pSrcStr) {
                    var i = 0;
                    while (i < pArr.length) {
                        if (pArr[i] == pSrcStr) {
                            pArr.splice(i, 1);
                        } else {
                            ++i;
                        }
                    }
                    return pArr;
                } else {
                    util.debug.error("Error while try to remove element from array. No element to remove is given.");
                }
            } else {
                util.debug.error("Error while try to remove element from array. Given array is not an array.");
            }
        },
        tooltip: {
            show: function (htmlContent, backgroundColor, maxWidth) {
                try {
                    if ($("#dynToolTip").length == 0) {
                        var tooltip = $("<div></div>")
                            .attr("id", "dynToolTip")
                            .css("max-width", "400px")
                            .css("position", "absolute")
                            .css("top", "0px")
                            .css("left", "0px")
                            .css("z-index", "2000")
                            .css("background-color", "rgba(240, 240, 240, 1)")
                            .css("padding", "10px")
                            .css("display", "block")
                            .css("top", "0")
                            .css("overflow-wrap", "break-word")
                            .css("word-wrap", "break-word")
                            .css("-ms-hyphens", "auto")
                            .css("-moz-hyphens", "auto")
                            .css("-webkit-hyphens", "auto")
                            .css("hyphens", "auto");
                        if (backgroundColor) {
                            tooltip.css("background-color", backgroundColor);
                        }
                        if (maxWidth) {
                            tooltip.css("max-width", maxWidth);
                        }
                        $("body").append(tooltip);
                    } else {
                        $("#dynToolTip").css("visibility", "visible");
                    }

                    $("#dynToolTip").html(htmlContent);
                    $("#dynToolTip")
                        .find("*")
                        .css("max-width", "100%")
                        .css("overflow-wrap", "break-word")
                        .css("word-wrap", "break-word")
                        .css("-ms-hyphens", "auto")
                        .css("-moz-hyphens", "auto")
                        .css("-webkit-hyphens", "auto")
                        .css("hyphens", "auto")
                        .css("white-space", "normal");
                    $("#dynToolTip")
                        .find("img")
                        .css("object-fit", "contain")
                        .css("object-position", "50% 0%");
                } catch (e) {
                    console.error('Error while try to show tooltip');
                    console.error(e);
                }
            },
            setPosition: function (event) {
                $("#dynToolTip").position({
                    my: "left+6 top+6",
                    of: event,
                    collision: "flipfit"
                });
            },
            hide: function () {
                $("#dynToolTip").css("visibility", "hidden");
            },
            remove: function () {
                $("#dynToolTip").remove();
            }
        },
        getStrByteLength: function (pStr) {
            if (pStr) {
                var tmp = encodeURIComponent(pStr).match(/%[89ABab]/g);
                return pStr.length + (tmp ? tmp.length : 0);
            }
            return 0;
        }
    };

    /***********************************************************************
     **
     ** Used to get item value as array
     **
     ***********************************************************************/
    function getItemValueAsArray(pConf) {
        var arr = [];
        var str = util.getItemValue(pConf.itemName);
        if (str != "") {
            arr = str.split(pConf.splitStr);
        }
        return arr;
    }

    /***********************************************************************
     **
     ** Used to render contextmenu
     **
     ***********************************************************************/
    function drawContextMenu(pItems, pEvent) {
        pEvent.preventDefault();
        var div = $("<div></div>");

        $.each(pItems, function (i, d) {
            var divS = $("<div></div>");
            if ((i + 1) < pItems.length) {
                divS.css("margin-bottom", "4px");
            }
            divS.css("cursor", "pointer");
            if (d.action) {
                divS.on("click", function () {
                    d.action();
                });
            }

            var spanS = $("<span></span>");
            if (util.isDefinedAndNotNull(d.icon)) {
                spanS.addClass("fa");
                spanS.addClass(d.icon);
            }
            spanS.css("width", "20px");
            spanS.css("line-height", "17px");
            divS.append(spanS);

            var spanS2 = $("<span></span>");
            spanS2.css("line-height", "16px");
            spanS2.css("vertical-align", "top");
            if (util.isDefinedAndNotNull(d.text)) {
                spanS2.text(d.text);
            }
            divS.append(spanS2);

            div.append(divS);
        });

        util.tooltip.show(div);
        util.tooltip.setPosition(pEvent);
        return false;
    }

    /***********************************************************************
     **
     ** Used to loop through all select items
     **
     ***********************************************************************/
    function renderPossibleItems(pEl, pObj, pConf) {
        var arr = getItemValueAsArray(pConf);

        $.each(pObj, function (i, el) {
            var cEl = $(el);

            var str = cEl.text().match(pConf.replexRegex)[1];

            var i = $("<i></i>");
            i.addClass("fa");

            if (arr.indexOf(str) > -1) {
                i.addClass(pConf.selectedIcon);
            } else {
                i.addClass(pConf.unselectedIcon);
            }
            i.addClass("dynamic-selection-element-icon");

            cEl.attr("key-str", str);
            cEl.addClass("dynamic-selection-element");
            cEl.css("cursor", "pointer");
            cEl.html(i);
            cEl.on("click", function () {
                handleSelectedData(pConf, str, i, pEl);
            });
            cEl.contextmenu(function (event) {
                var objArr = [];

                objArr.push({
                    icon: pConf.selectedIcon,
                    text: pConf.selectAllText,
                    action: function () {
                        var iEl = $(pEl).find(".dynamic-selection-element-icon");
                        var saStr = "";
                        var tStr = "";
                        var sep = "";
                        $.each($(pEl).find(".dynamic-selection-element"), function (i, saEl) {
                            var val = $(saEl).attr("key-str");
                            if (pConf.noCLOB) {
                                tStr += sep + val;
                                var l = util.getStrByteLength(tStr);
                                if (l > pConf.maxLength) {
                                    return false;
                                }
                            }
                            saStr += sep + val;
                            sep = pConf.splitStr;
                            $(saEl).children(".dynamic-selection-element-icon").addClass(pConf.selectedIcon);
                            $(saEl).children(".dynamic-selection-element-icon").removeClass(pConf.unselectedIcon);
                        });

                        util.setItemValue(pConf.itemName, saStr);
                    }
                });

                objArr.push({
                    icon: pConf.unselectedIcon,
                    text: pConf.unselectAllText,
                    action: function () {
                        var iEl = $(pEl).find(".dynamic-selection-element-icon");
                        iEl.removeClass(pConf.selectedIcon);
                        iEl.addClass(pConf.unselectedIcon);
                        util.setItemValue(pConf.itemName, "");
                    }
                });

                drawContextMenu(objArr, event);
            });

            $(document).on("touchstart click", function (e) {
                if ((!cEl.is(e.target) && cEl.has(e.target).length === 0)) {
                    util.tooltip.hide();
                }
            });

        });
    }

    /***********************************************************************
     **
     ** Used to handle selected data
     **
     ***********************************************************************/
    function handleSelectedData(pConf, pValue, pEl, pParent) {
        var i = $(pEl);
        var str = "";
        var aor = i.hasClass(pConf.unselectedIcon);
        var arr = getItemValueAsArray(pConf);

        if (aor) {
            arr.push(pValue);
            str = arr.join(pConf.splitStr);
            if (pConf.noCLOB) {
                var l = util.getStrByteLength(str);
                if (l > pConf.maxLength) {
                    return;
                }
            }
            util.setItemValue(pConf.itemName, str);
            i.removeClass(pConf.unselectedIcon);
            i.addClass(pConf.selectedIcon);
        } else {
            util.removeElementFromArray(arr, pValue);
            i.removeClass(pConf.selectedIcon);
            i.addClass(pConf.unselectedIcon);
            str = arr.join(pConf.splitStr);
            util.setItemValue(pConf.itemName, str);
        }
    }

    /***********************************************************************
     **
     ** Used to to find possible items
     **
     ***********************************************************************/
    function findePossibleItems(pEl, pConf) {
        try {
            var regex = new RegExp(pConf.replexRegex);

            if (pConf.type === "report") {
                var allObj = $(pEl).find("td").filter(function () {
                    return regex.test($(this).text());
                });

                renderPossibleItems(pEl, allObj, pConf);
            } else {
                var allObj = $(pEl).find(".dynamic-selection-element").filter(function () {
                    return regex.test($(this).text());
                });

                renderPossibleItems(pEl, allObj, pConf);
            }
        } catch (e) {
            util.debug.error({
                "module": "findePossibleItems",
                "msg": "error while try to render selection items",
                "err": e
            });
        }
    }

    return {
        initialize: function (pThis, pUseType, pUsedRegex, pItemName, pSplitStr, pUnselectedIcon, pSelecedIcon, pUnselectAllText, pSelectAllText, pNoCLOB) {

            util.debug.info({
                "pThis": pThis,
                "pUseType": pUseType,
                "pUsedRegex": pUsedRegex,
                "pItemName": pItemName,
                "pSplitStr": pSplitStr,
                "pUnselectIcon": pUnselectedIcon,
                "pSelectIcon": pSelecedIcon,
                "pUnselectAllText": pUnselectAllText,
                "pSelectAllText": pSelectAllText,
                "pNoCLOB": pNoCLOB
            });

            var conf = {};
            conf.this = pThis;
            conf.type = pUseType;
            conf.itemName = pItemName;
            conf.splitStr = pSplitStr;
            conf.replexRegex = pUsedRegex;
            conf.unselectedIcon = pUnselectedIcon;
            conf.selectedIcon = pSelecedIcon;
            conf.unselectAllText = pUnselectAllText;
            conf.selectAllText = pSelectAllText;
            conf.maxLength = 4000;
            conf.noCLOB = true;

            if (pNoCLOB === "N") {
                conf.noCLOB = false;
            }

            $.each(pThis.affectedElements, function (i, pEl) {
                findePossibleItems(pEl, conf);

                $(pEl).on("apexafterrefresh", function () {
                    findePossibleItems(pEl, conf);
                });

                $(pEl).on("gridpagechange", function () {
                    findePossibleItems(pEl, conf);
                });

            });
        }
    }
})();
