/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/* ************************************************************************

#module(html2)

************************************************************************ */

/**
 * The intention of this class is to bring more convenience to the attribute
 * and style features implemented by the other classes. It wraps the features
 * of multiple classes in one unique interface.
 *
 * There is a automatic detection if the given name should be interpreted
 * as HTML property, attribute or style. It even supports complex
 * setter/getter pairs like opacity. All these features are usable through
 * the same interface by just using the name of the attribute/style etc. to
 * modify/query.
 *
 * This class is optimized for performance, but is not as optimal in performance
 * aspects than the more native implementations. For all highly performance
 * crititcal areas like animations it would be the best to directly use the
 * classes which contain the implementations.
 */
qx.Class.define("qx.bom.Element",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      CREATION
    ---------------------------------------------------------------------------
    */    
    
    /**
     * Creates an DOM element
     *
     * @type static
     * @param name {String} Tag name of the element
     * @param win {Window} Window to create document for
     * @param xhtml {Boolean ? false} Enable XHTML
     * @return {Element} the created element node
     */
    create : function(name, win, xhtml)
    {
      if (!win) {
        win = window;
      }

      if (xhtml) {
        return win.document.createElementNS("http://www.w3.org/1999/xhtml", name);
      } else {
        return win.document.createElement(name);
      }
    },
    
    
    
    
    
    
    /*
    ---------------------------------------------------------------------------
      GENERIC INTERFACE
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the given attribute or style of the element.
     * Automatically determines if the given property should be
     * interpreted as a style property, attribute name, or
     * comes with a custom getter.
     *
     * @type static
     * @param element {Element} DOM element to modify
     * @param property {String} Name of attribute or style
     * @return {var} the resulting value
     */
    get : function(element, property)
    {
      var custom = this.__custom[property];
      
      if (custom) 
      {
        if (!custom.get) {
          throw new Error("Property " + property + " does not support to be changed.");
        }
        
        return custom.context[custom.get](element);
      }
      else
      {
        if (this.__style[property]) {
          return qx.bom.element.Style.getComputed(element, property);
        } else {
          return qx.bom.element.Attribute.get(element, property);
        }
      }
      
      return element;        
    },
    
    
    /**
     * Applies the given attribute or style to the element.
     * Automatically determines if the given property should be
     * interpreted as a style property, attribute name, or
     * requires a custom setter.
     *
     * @type static
     * @param element {Element} DOM element to modify
     * @param property {String} Name of attribute or style
     * @param value {var} Any acceptable value for the given attribute or style
     * @return {var} the new value
     */
    set : function(element, property, value)
    {
      var custom = this.__custom[property];
      
      if (custom) 
      {
        if (!custom.set) {
          throw new Error("Property " + property + " does not support to be changed.");
        }
        
        if (custom.multiarg)
        {
          var args = qx.lang.Array.fromArguments(arguments);
          qx.lang.Array.removeAt(args, 1); // remove 'property'
          
          custom.context[custom.set].call(custom.context, args);
        }
        else
        {
          custom.context[custom.set](element, value);
        }
      }
      else
      {
        if (this.__style[property]) {
          qx.bom.element.Style.set(element, property, value);
        } else {
          qx.bom.element.Attribute.set(element, property, value);
        }
      }
      
      return element;
    },


    /**
     * Resets the given attribute or style to the element.
     * Automatically determines if the given property should be
     * interpreted as a style property, attribute name, or
     * requires a custom resetter.
     *
     * @type static
     * @param element {Element} DOM element to modify
     * @param property {String} Name of attribute or style
     * @param value {var} Any acceptable value for the given attribute or style
     * @return {var} the new value
     */    
    reset : function(element, property)
    {
      var custom = this.__custom[property];
      
      if (custom) 
      {
        if (!custom.set) {
          throw new Error("Property " + property + " does not support to be changed.");
        }
        
        custom.context[custom.reset](element, value);
      }
      else
      {
        if (this.__style[property]) {
          qx.bom.element.Style.reset(element, property, value);
        } else {
          qx.bom.element.Attribute.reset(element, property, value);
        }
      }
      
      return element;      
    },
    
    
    /** {Map} Internal data structures to map to separate implementation classes */
    __custom : 
    {
      clip : 
      {
        context : qx.bom.element.Clip,
        multiarg : true
      },
      
      cursor : 
      {
        context : qx.bom.element.Cursor
      },
      
      boxWidth : 
      {
        context : qx.bom.element.Dimension,
        get : "getWidth"
      },
      
      boxHeight : 
      {
        context : qx.bom.element.Dimension,
        get : "getHeight"
      },
      
      innerWidth : 
      {
        context : qx.bom.element.Dimension,
        get : "getInnerWidth"
      },
      
      innerHeight : 
      {
        context : qx.bom.element.Dimension,
        get : "getInnerHeight"
      },   
      
      scrollWidth : 
      {
        context : qx.bom.element.Dimension,
        get : "getScrollWidth"
      },
      
      scrollHeight : 
      {
        context : qx.bom.element.Dimension,
        get : "getScrollHeight"
      },                
      
      locationLeft : 
      {
        context : qx.bom.element.Location,
        get : "getLeft"
      },
      
      locationTop : 
      {
        context : qx.bom.element.Location,
        get : "getTop"
      },
            
      opacity : 
      {
        context : qx.bom.element.Opacity
      },
      
      overflowX : 
      {
        context : qx.bom.element.Overflow,
        set : "setX",
        get : "getX",
        reset : "resetX" 
      },
      
      overflowY : 
      {
        context : qx.bom.element.Overflow,
        set : "setX",
        get : "getX",
        reset : "resetX" 
      },
      
      scrollX : 
      {
        context : qx.bom.element.Scroll,
        set : "setX",
        get : "getX",
        reset : "resetX" 
      },
      
      scrollY : 
      {
        context : qx.bom.element.Scroll,
        set : "setX",
        get : "getX",
        reset : "resetX" 
      },
      
      visibility : 
      {
        context : qx.bom.element.Visibility
      }    
    },
    
    
    /** Initializes generic interface */
    __init : function()
    {
      // Generate style data
      var source = document.createElement("div").style;
      var target = this.__style = {};
      
      for (var key in source) {
        target[key] = true;
      }
      
      // Process custom data
      var custom = this.__custom;
      var value;
      for (var key in custom)
      {
        value = custom[key];
        
        if (value.set === undefined && value.get === undefined && value.reset === undefined)
        {
          value.set = "set";
          value.get = "get";
          value.reset = "reset";
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    statics.__init();
  }
});
