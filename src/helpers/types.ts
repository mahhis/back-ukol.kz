export type TPhoneNumber = {
  phoneNumber: string
}

export type TPhoneNumberAndCode = {
  phoneNumber: string
  code: string
}

export type TUser = {
  phoneNumber?: string
}

export type TRating = {
  rating?: number
  comment?: string
}

export type TOrder = {
  title?: string
  streetAndBuildingNumber?: string
  flat?: string
  floor?: string
  amount?: number
  options: {
    isChild: boolean
    isNeedWoman: boolean
    isNeedPharmacy: boolean
    isHaveDoctorsAppointment: boolean
    isWithDrugsCocktail: boolean
    isPremiumIntoxication: boolean
    isWithDressingMaterial: boolean
    isWithMaterialsPoisoning: boolean
    photoURL: string
    daysForNurse: number
    message: string
  }
  arrivalTime: {
    hours: string
    minutes: string
    isNearestHour: boolean
    date: string | null
  }
  idMessageWA?: string
}
