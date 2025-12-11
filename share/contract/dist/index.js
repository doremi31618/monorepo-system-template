function ot() {
  return "contract";
}
var x = (
  /** @class */
  /* @__PURE__ */ (function() {
    function t(e) {
      this.groups = [], this.each = !1, this.context = void 0, this.type = e.type, this.name = e.name, this.target = e.target, this.propertyName = e.propertyName, this.constraints = e?.constraints, this.constraintCls = e.constraintCls, this.validationTypeOptions = e.validationTypeOptions, e.validationOptions && (this.message = e.validationOptions.message, this.groups = e.validationOptions.groups, this.always = e.validationOptions.always, this.each = e.validationOptions.each, this.context = e.validationOptions.context);
    }
    return t;
  })()
), $ = (
  /** @class */
  (function() {
    function t() {
    }
    return t.prototype.transform = function(e) {
      var n = [];
      return Object.keys(e.properties).forEach(function(r) {
        e.properties[r].forEach(function(a) {
          var o = {
            message: a.message,
            groups: a.groups,
            always: a.always,
            each: a.each
          }, f = {
            type: a.type,
            name: a.name,
            target: e.name,
            propertyName: r,
            constraints: a.constraints,
            validationTypeOptions: a.options,
            validationOptions: o
          };
          n.push(new x(f));
        });
      }), n;
    }, t;
  })()
);
function G() {
  if (typeof globalThis < "u")
    return globalThis;
  if (typeof global < "u")
    return global;
  if (typeof window < "u")
    return window;
  if (typeof self < "u")
    return self;
}
var q = function(t) {
  var e = typeof Symbol == "function" && Symbol.iterator, n = e && t[e], r = 0;
  if (n) return n.call(t);
  if (t && typeof t.length == "number") return {
    next: function() {
      return t && r >= t.length && (t = void 0), { value: t && t[r++], done: !t };
    }
  };
  throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
}, D = function(t, e) {
  var n = typeof Symbol == "function" && t[Symbol.iterator];
  if (!n) return t;
  var r = n.call(t), a, o = [], f;
  try {
    for (; (e === void 0 || e-- > 0) && !(a = r.next()).done; ) o.push(a.value);
  } catch (d) {
    f = { error: d };
  } finally {
    try {
      a && !a.done && (n = r.return) && n.call(r);
    } finally {
      if (f) throw f.error;
    }
  }
  return o;
}, z = function(t, e, n) {
  if (n || arguments.length === 2) for (var r = 0, a = e.length, o; r < a; r++)
    (o || !(r in e)) && (o || (o = Array.prototype.slice.call(e, 0, r)), o[r] = e[r]);
  return t.concat(o || Array.prototype.slice.call(e));
}, E = (
  /** @class */
  (function() {
    function t() {
      this.validationMetadatas = /* @__PURE__ */ new Map(), this.constraintMetadatas = /* @__PURE__ */ new Map();
    }
    return Object.defineProperty(t.prototype, "hasValidationMetaData", {
      get: function() {
        return !!this.validationMetadatas.size;
      },
      enumerable: !1,
      configurable: !0
    }), t.prototype.addValidationSchema = function(e) {
      var n = this, r = new $().transform(e);
      r.forEach(function(a) {
        return n.addValidationMetadata(a);
      });
    }, t.prototype.addValidationMetadata = function(e) {
      var n = this.validationMetadatas.get(e.target);
      n ? n.push(e) : this.validationMetadatas.set(e.target, [e]);
    }, t.prototype.addConstraintMetadata = function(e) {
      var n = this.constraintMetadatas.get(e.target);
      n ? n.push(e) : this.constraintMetadatas.set(e.target, [e]);
    }, t.prototype.groupByPropertyName = function(e) {
      var n = {};
      return e.forEach(function(r) {
        n[r.propertyName] || (n[r.propertyName] = []), n[r.propertyName].push(r);
      }), n;
    }, t.prototype.getTargetValidationMetadatas = function(e, n, r, a, o) {
      var f, d, w = function(i) {
        return typeof i.always < "u" ? i.always : i.groups && i.groups.length ? !1 : r;
      }, b = function(i) {
        return !!(a && (!o || !o.length) && i.groups && i.groups.length);
      }, R = this.validationMetadatas.get(e) || [], T = R.filter(function(i) {
        return i.target !== e && i.target !== n ? !1 : w(i) ? !0 : b(i) ? !1 : o && o.length > 0 ? i.groups && !!i.groups.find(function(p) {
          return o.indexOf(p) !== -1;
        }) : !0;
      }), N = [];
      try {
        for (var h = q(this.validationMetadatas.entries()), y = h.next(); !y.done; y = h.next()) {
          var V = D(y.value, 2), j = V[0], F = V[1];
          e.prototype instanceof j && N.push.apply(N, z([], D(F), !1));
        }
      } catch (i) {
        f = { error: i };
      } finally {
        try {
          y && !y.done && (d = h.return) && d.call(h);
        } finally {
          if (f) throw f.error;
        }
      }
      var B = N.filter(function(i) {
        return typeof i.target == "string" || i.target === e || i.target instanceof Function && !(e.prototype instanceof i.target) ? !1 : w(i) ? !0 : b(i) ? !1 : o && o.length > 0 ? i.groups && !!i.groups.find(function(p) {
          return o.indexOf(p) !== -1;
        }) : !0;
      }), U = B.filter(function(i) {
        return !T.find(function(p) {
          return p.propertyName === i.propertyName && p.type === i.type;
        });
      });
      return T.concat(U);
    }, t.prototype.getTargetValidatorConstraints = function(e) {
      return this.constraintMetadatas.get(e) || [];
    }, t;
  })()
);
function A() {
  var t = G();
  return t.classValidatorMetadataStorage || (t.classValidatorMetadataStorage = new E()), t.classValidatorMetadataStorage;
}
var _ = (
  /** @class */
  (function() {
    function t() {
    }
    return t.isValid = function(e) {
      var n = this;
      return e !== "isValid" && e !== "getMessage" && Object.keys(this).map(function(r) {
        return n[r];
      }).indexOf(e) !== -1;
    }, t.CUSTOM_VALIDATION = "customValidation", t.NESTED_VALIDATION = "nestedValidation", t.PROMISE_VALIDATION = "promiseValidation", t.CONDITIONAL_VALIDATION = "conditionalValidation", t.WHITELIST = "whitelistValidation", t.IS_DEFINED = "isDefined", t;
  })()
), H = new /** @class */
((function() {
  function t() {
    this.instances = [];
  }
  return t.prototype.get = function(e) {
    var n = this.instances.find(function(r) {
      return r.type === e;
    });
    return n || (n = { type: e, object: new e() }, this.instances.push(n)), n.object;
  }, t;
})())();
function k(t) {
  return H.get(t);
}
var W = (
  /** @class */
  (function() {
    function t(e, n, r) {
      r === void 0 && (r = !1), this.target = e, this.name = n, this.async = r;
    }
    return Object.defineProperty(t.prototype, "instance", {
      // -------------------------------------------------------------------------
      // Accessors
      // -------------------------------------------------------------------------
      /**
       * Instance of the target custom validation class which performs validation.
       */
      get: function() {
        return k(this.target);
      },
      enumerable: !1,
      configurable: !0
    }), t;
  })()
);
function Y(t) {
  var e;
  if (t.validator instanceof Function) {
    e = t.validator;
    var n = k(E).getTargetValidatorConstraints(t.validator);
    if (n.length > 1)
      throw "More than one implementation of ValidatorConstraintInterface found for validator on: ".concat(t.target.name, ":").concat(t.propertyName);
  } else {
    var r = t.validator;
    e = /** @class */
    (function() {
      function o() {
      }
      return o.prototype.validate = function(f, d) {
        return r.validate(f, d);
      }, o.prototype.defaultMessage = function(f) {
        return r.defaultMessage ? r.defaultMessage(f) : "";
      }, o;
    })(), A().addConstraintMetadata(new W(e, t.name, t.async));
  }
  var a = {
    type: t.name && _.isValid(t.name) ? t.name : _.CUSTOM_VALIDATION,
    name: t.name,
    target: t.target,
    propertyName: t.propertyName,
    validationOptions: t.options,
    constraintCls: e,
    constraints: t.constraints
  };
  A().addValidationMetadata(new x(a));
}
function g(t, e) {
  return function(n) {
    var r = "";
    return t(r, n);
  };
}
function v(t, e) {
  return function(n, r) {
    Y({
      name: t.name,
      target: n.constructor,
      propertyName: r,
      options: e,
      constraints: t.constraints,
      validator: t.validator
    });
  };
}
var J = "isNotEmpty";
function K(t) {
  return t !== "" && t !== null && t !== void 0;
}
function s(t) {
  return v({
    name: J,
    validator: {
      validate: function(e, n) {
        return K(e);
      },
      defaultMessage: g(function(e) {
        return e + "$property should not be empty";
      })
    }
  }, t);
}
var Q = "isDate";
function X(t) {
  return t instanceof Date && !isNaN(t.getTime());
}
function m(t) {
  return v({
    name: Q,
    validator: {
      validate: function(e, n) {
        return X(e);
      },
      defaultMessage: g(function(e) {
        return e + "$property must be a Date instance";
      })
    }
  }, t);
}
var Z = "isNumber";
function tt(t, e) {
  if (e === void 0 && (e = {}), typeof t != "number")
    return !1;
  if (t === 1 / 0 || t === -1 / 0)
    return !!e.allowInfinity;
  if (Number.isNaN(t))
    return !!e.allowNaN;
  if (e.maxDecimalPlaces !== void 0) {
    var n = 0;
    if (t % 1 !== 0 && (n = t.toString().split(".")[1].length), n > e.maxDecimalPlaces)
      return !1;
  }
  return Number.isFinite(t);
}
function M(t, e) {
  return t === void 0 && (t = {}), v({
    name: Z,
    constraints: [t],
    validator: {
      validate: function(n, r) {
        return tt(n, r?.constraints[0]);
      },
      defaultMessage: g(function(n) {
        return n + "$property must be a number conforming to the specified constraints";
      })
    }
  }, e);
}
var et = "isString";
function nt(t) {
  return t instanceof String || typeof t == "string";
}
function l(t) {
  return v({
    name: et,
    validator: {
      validate: function(e, n) {
        return nt(e);
      },
      defaultMessage: g(function(e) {
        return e + "$property must be a string";
      })
    }
  }, t);
}
var rt = Object.defineProperty, u = (t, e, n, r) => {
  for (var a = void 0, o = t.length - 1, f; o >= 0; o--)
    (f = t[o]) && (a = f(e, n, a) || a);
  return a && rt(e, n, a), a;
};
class I {
  constructor(e, n, r, a) {
    this.token = e, this.refreshToken = n, this.userId = r, this.name = a;
  }
  token;
  refreshToken;
  userId;
  name;
}
u([
  l(),
  s()
], I.prototype, "token");
u([
  l(),
  s()
], I.prototype, "refreshToken");
u([
  M(),
  s()
], I.prototype, "userId");
u([
  l(),
  s()
], I.prototype, "name");
class c {
  token;
  userId;
  name;
  expiresAt;
  createdAt;
  updatedAt;
}
u([
  l(),
  s()
], c.prototype, "token");
u([
  M(),
  s()
], c.prototype, "userId");
u([
  l(),
  s()
], c.prototype, "name");
u([
  m(),
  s()
], c.prototype, "expiresAt");
u([
  m(),
  s()
], c.prototype, "createdAt");
u([
  m(),
  s()
], c.prototype, "updatedAt");
class C {
  email;
  password;
}
u([
  l(),
  s()
], C.prototype, "email");
u([
  l(),
  s()
], C.prototype, "password");
class at {
  userId;
}
u([
  M(),
  s()
], at.prototype, "userId");
class O {
  email;
  password;
  name;
}
u([
  l(),
  s()
], O.prototype, "email");
u([
  l(),
  s()
], O.prototype, "password");
u([
  l(),
  s()
], O.prototype, "name");
class it {
  email;
}
u([
  l(),
  s()
], it.prototype, "email");
class L {
  token;
  password;
}
u([
  l(),
  s()
], L.prototype, "token");
u([
  l(),
  s()
], L.prototype, "password");
class S {
  token;
  expiresAt;
  resetLink;
}
u([
  l(),
  s()
], S.prototype, "token");
u([
  m(),
  s()
], S.prototype, "expiresAt");
u([
  l(),
  s()
], S.prototype, "resetLink");
class P {
  userId;
  redirect;
}
u([
  M(),
  s()
], P.prototype, "userId");
u([
  l(),
  s()
], P.prototype, "redirect");
export {
  C as LoginDto,
  P as LoginResponseDto,
  L as ResetConfirmDto,
  it as ResetRequestDto,
  S as ResetResponseDto,
  c as SessionDto,
  at as SignoutDto,
  O as SignupDto,
  I as UserIdentityDto,
  ot as contract
};
