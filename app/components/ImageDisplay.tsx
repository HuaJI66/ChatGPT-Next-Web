// ImageDisplay.tsx

import React, {useState} from 'react';

interface ImageDisplayProps {
    imageUrl: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({imageUrl}) => {
    const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    return (
        <div>
            {!isImageLoaded && <div>Loading...</div>}
            <img
                src={imageUrl}
                alt="Displayed Image"
                onLoad={handleImageLoad}
                style={{display: isImageLoaded ? 'width: 16px;height: 16px' : 'none'}}
            />
        </div>
    );
};

export default ImageDisplay;
