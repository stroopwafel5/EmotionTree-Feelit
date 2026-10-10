package com.emotiontree

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * PasswordHasherPackage.kt
 * --------------------------------------------------------------------------
 * Tells React Native about PasswordHasherModule (fast password hashing).
 * It is added to the app in MainApplication.kt.
 */
class PasswordHasherPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == PasswordHasherModule.NAME) PasswordHasherModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        PasswordHasherModule.NAME to
            ReactModuleInfo(
                name = PasswordHasherModule.NAME,
                className = PasswordHasherModule::class.java.name,
                canOverrideExistingModule = false,
                needsEagerInit = false,
                isCxxModule = false,
                isTurboModule = false,
            ),
    )
  }
}
