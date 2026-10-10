package com.emotiontree

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * PasswordHasherModule.kt
 * --------------------------------------------------------------------------
 * Hashes passwords with Android's OWN built-in PBKDF2-HMAC-SHA256
 * (javax.crypto). This is many times faster than doing the same maths in
 * JavaScript, so "Make my account" and "Log in" take a moment instead of
 * many seconds, and we can use more rounds (= safer).
 *
 * The app calls it from src/services/authService.ts:
 *   NativeModules.PasswordHasher.pbkdf2Sha256(password, salt, rounds, 32)
 * It gives back the hash as hex text - exactly the same result as the
 * JavaScript version (@noble/hashes), so the two can be mixed.
 *
 * Needs Android 8 (API 26) or newer. On older phones the call fails and
 * the app uses the JavaScript version instead.
 */
class PasswordHasherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun pbkdf2Sha256(
      password: String,
      salt: String,
      iterations: Double,
      keyLength: Double,
      promise: Promise,
  ) {
    // Work on a background thread, so nothing else has to wait.
    Thread {
          try {
            val spec =
                PBEKeySpec(
                    password.toCharArray(),
                    salt.toByteArray(Charsets.UTF_8),
                    iterations.toInt(),
                    keyLength.toInt() * 8,
                )
            val key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
            spec.clearPassword()
            promise.resolve(key.joinToString("") { (it.toInt() and 0xff).toString(16).padStart(2, '0') })
          } catch (e: Exception) {
            promise.reject("E_PASSWORD_HASH", e.message, e)
          }
        }
        .start()
  }

  companion object {
    const val NAME = "PasswordHasher"
  }
}
