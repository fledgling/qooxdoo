/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/*
#require(qx.event.dispatch.Direct)
*/

/**
 * The qx.locale.Manager provides static translation methods (like tr()) and
 * general locale information.
 */

qx.Class.define("qx.locale.Manager",
{
  type : "singleton",
  extend : qx.util.ValueManager,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this._translationCatalog = window.qxlocales || {};

    var clazz = qx.bom.client.Locale;

    var locale = clazz.LOCALE;
    var variant = clazz.VARIANT;
    if (variant !== "") {
      locale += "_" + variant;
    }

    this.setLocale(locale || this._defaultLocale);
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Translate a message
     *
     * @type static
     * @param messageId {String} message id (may contain format strings)
     * @param varargs {Object} variable number of argumes applied to the format string
     * @return {String|qx.locale.LocalizedString} TODOC
     * @see qx.lang.String.format
     */
    tr : function(messageId, varargs)
    {
      var args = qx.lang.Array.fromArguments(arguments);
      args.splice(0, 1);

      return this.__translateDynamic(messageId, args);
    },


    /**
     * Translate a plural message
     *
     * Depending on the third argument the plural or the singular form is chosen.
     *
     * @type static
     * @param singularMessageId {String} message id of the singular form (may contain format strings)
     * @param pluralMessageId {String} message id of the plural form (may contain format strings)
     * @param count {Integer} if greater than 1 the plural form otherwhise the singular form is returned.
     * @param varargs {Object} variable number of argumes applied to the format string
     * @return {String|qx.locale.LocalizedString} TODOC
     * @see qx.lang.String.format
     */
    trn : function(singularMessageId, pluralMessageId, count, varargs)
    {
      var args = qx.lang.Array.fromArguments(arguments);
      args.splice(0, 3);

      if (count > 1) {
        return this.__translateDynamic(pluralMessageId, args);
      } else {
        return this.__translateDynamic(singularMessageId, args);
      }
    },


    /**
     * Translate a message with translation hint
     *
     * @type static
     * @param hint {String} hint for the translator of the message. Will be included in the .pot file.
     * @param messageId {String} message id (may contain format strings)
     * @param varargs {Object} variable number of argumes applied to the format string
     * @return {String|qx.locale.LocalizedString} TODOC
     * @see qx.lang.String.format
     */
    trc : function(hint, messageId, varargs)
    {
      var args = qx.lang.Array.fromArguments(arguments);
      args.splice(0, 2);

      return this.__translateDynamic(singularMessageId, args);
    },


    /**
     * Mark the message for translation but return the original message.
     *
     * @type static
     * @param messageId {String} the message ID
     * @return {String} messageId
     */
    marktr : function(messageId) {
      return messageId;
    },


    /**
     * Translates the message ID in the synamic mode by returning a
     * LocalizedString instance and in the static mode by returning the
     * translated string.
     *
     * @param messageId {String} message id (may contain format strings)
     * @param args {Object[]} array of objects, which are inserted into the format string.
     * @param locale {String} optional locale to be used for translation
     * @return {String|LocalizedString} translated message.
     */
    __translateDynamic : function(messageId, args, locale)
    {
      if (qx.core.Variant.isSet("qx.dynamicLocaleSwitch", "on")) {
        return new qx.locale.LocalizedString(messageId, args, locale);
      } else {
        return qx.locale.Manager.getInstance().translate(messageId, args, locale);
      }
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** current locale. locale is an language code like de, de_AT, en, en_GB, fr, ... */
    locale :
    {
      check : "String",
      nullable : true,
      apply : "_applyLocale",
      event : "changeLocale"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    _defaultLocale : "C",


    /**
     * Get the language code of the currnt locale
     *
     * This is the first part of a locale definition. The language for "de_DE" would be "de"
     *
     * @type member
     * @return {String} language code
     */
    getLanguage : function() {
      return this._language;
    },


    /**
     * Get the territory code of the currnt locale
     *
     * This is the second part of a locale definition. The territory for "de_DE" would be "DE"
     *
     * @type member
     * @return {String} territory code
     */
    getTerritory : function() {
      return this.getLocale().split("_")[1] || "";
    },


    /**
     * Return the available application locales
     *
     * This corresponds to the Makefile APPLICATION_LOCALES setting
     *
     * @type member
     * @return {String[]} array of available locales
     */
    getAvailableLocales : function()
    {
      var locales = [];

      for (var locale in this._translationCatalog)
      {
        if (locale != this._defaultLocale) {
          locales.push(locale);
        }
      }

      return locales;
    },


    /**
     * Extract the language part from a locale.
     *
     * @type member
     * @param locale {String} locale to be used
     * @return {String} language
     */
    _extractLanguage : function(locale)
    {
      var language;
      var pos = locale.indexOf("_");

      if (pos == -1) {
        language = locale;
      } else {
        language = locale.substring(0, pos);
      }

      return language;
    },


    // property apply
    _applyLocale : function(value, old)
    {
      this._locale = value;
      this._language = this._extractLanguage(value);
      this.updateAll();
    },


    /**
     * Add a translation to the translation manager
     *
     * @type member
     * @param languageCode {String} language code of the translation like de, de_AT, en, en_GB, fr, ...
     * @param translationMap {Map} mapping of message identifiers (english text) to the target language
     * @return {void}
     */
    addTranslation : function(languageCode, translationMap)
    {
      if (this._translationCatalog[languageCode])
      {
        for (var key in translationMap) {
          this._translationCatalog[languageCode][key] = translationMap[key];
        }
      }
      else
      {
        this._translationCatalog[languageCode] = translationMap;
      }
    },


    /**
     * Extract language code from class name and add a translation to the translation manager
     *
     * @type member
     * @param classname {String} class name of a translation
     * @param translationMap {Map} mapping of message identifiers (english text) to the target language
     * @return {void}
     */
    addTranslationFromClass : function(classname, translationMap) {
      this.addTranslation(classname.substring(classname.lastIndexOf(".")+1), translationMap);
    },


    /**
     * Translate a message using the current locale and apply format string to the arguments.
     *
     * @type member
     * @param messageId {String} message id (may contain format strings)
     * @param args {Object[]} array of objects, which are inserted into the format string.
     * @param locale {String} optional locale to be used for translation
     * @return {String} translated message.
     */
    translate : function(messageId, args, locale)
    {
      var txt;

      if (locale) {
        var language = this._extractLanguage(locale);
      }
      else
      {
        locale = this._locale;
        language = this._language;
      }

      if (!txt && this._translationCatalog[locale]) {
        txt = this._translationCatalog[locale][messageId];
      }

      if (!txt && this._translationCatalog[language]) {
        txt = this._translationCatalog[language][messageId];
      }

      if (!txt && this._translationCatalog[this._defaultLocale]) {
        txt = this._translationCatalog[this._defaultLocale][messageId];
      }

      if (!txt) {
        txt = messageId;
      }

      if (args.length > 0) {
        txt = qx.lang.String.format(txt, args);
      }

      return txt;
    },


    /**
     * Overridden method from {@link qx.util.ValueManager}.
     *
     * @internal
     * @param text {LocalizedString|String} input text
     * @return {Boolean} whether the string value is dynamic
     */
    isDynamic : function(text)
    {
      return text instanceof qx.locale.LocalizedString;
    },


    /**
     * Overridden method from {@link qx.util.ValueManager}.
     *
     * @internal
     * @param text {LocalizedString} input text
     * @return {String} current value of the localized string.
     */
    resolveDynamic : function(text) {
      return text.toString();
    }


  },


  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    if (qx.core.Variant.isSet("qx.dynamicLocaleSwitch", "on")) {
      qx.Class.include(qx.core.Object, qx.locale.dynamic.MObject);
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeFields("_translationCatalog");
  }
});
