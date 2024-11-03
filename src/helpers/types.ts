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

export type TOrder = {
  title?: string
  address?: string
  amount?: number
  options: {
    isNeedPharmacy: boolean
    isHaveDoctorsAppointment: boolean
    isWithDrugsCocktail: boolean
    isPremiumIntoxication: boolean
    isWithDressingMaterial: boolean
    photoURL: string
    daysForNurse: number
    message: string
  }
  arrivalTime: {
    hours: string
    minutes: string
    isNearestHour: boolean
  }
  idMessageWA?: string
}
