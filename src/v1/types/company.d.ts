interface SocialLinksAttributes {
    faceBook: string;
    youTube: string;
    instagram: string;
    x: string;
    telegram: string;
}

interface UPIAttributes {
    UPIId: string;
    UPINumber: string;
}

interface AddressAttributes {
    address: string;
    district: string;
    state: string;
    pinCode: string;
}



export { SocialLinksAttributes, UPIAttributes, AddressAttributes };