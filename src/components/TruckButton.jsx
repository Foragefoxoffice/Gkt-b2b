import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import './TruckButton.css';

const TruckButton = ({ apiCall, onComplete, defaultText = 'Place Order', successText = 'Order Placed', className = '', style = {} }) => {
  const buttonRef = useRef(null);
  const boxRef = useRef(null);
  const truckRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    if (isAnimating) return;

    const button = buttonRef.current;
    const box = boxRef.current;
    const truck = truckRef.current;

    setIsAnimating(true);

    // Start animation
    button.classList.add('animation');

    gsap.to(button, {
      '--box-s': 1,
      '--box-o': 1,
      duration: .3,
      delay: .5
    });

    gsap.to(box, {
      x: 0,
      duration: .4,
      delay: .7
    });

    gsap.to(button, {
      '--hx': -5,
      '--bx': 50,
      duration: .18,
      delay: .92
    });

    gsap.to(box, {
      y: 0,
      duration: .1,
      delay: 1.15
    });

    gsap.set(button, {
      '--truck-y': 0,
      '--truck-y-n': -26
    });

    // Wait for the box drop animation AND the API call to complete
    let animationDone = new Promise(resolve => setTimeout(resolve, 1250));
    let apiPromise = apiCall ? apiCall() : Promise.resolve();

    try {
      await Promise.all([animationDone, apiPromise]);

      // Now do the truck bounce and drive away
      gsap.to(button, {
        '--truck-y': 1,
        '--truck-y-n': -25,
        duration: .2,
        onComplete() {
          gsap.timeline({
            onComplete() {
              button.classList.add('done');
              if (onComplete) {
                setTimeout(() => onComplete(), 500);
              }
              // Reset the button after some time so it can be used again if needed
              setTimeout(() => {
                if (buttonRef.current) {
                  setIsAnimating(false);
                  buttonRef.current.classList.remove('animation', 'done');
                  gsap.set(truckRef.current, { x: 4 });
                  gsap.set(buttonRef.current, {
                    '--progress': 0,
                    '--hx': 0,
                    '--bx': 0,
                    '--box-s': .5,
                    '--box-o': 0,
                    '--truck-y': 0,
                    '--truck-y-n': -26
                  });
                  gsap.set(boxRef.current, { x: -24, y: -6 });
                }
              }, 3000);
            }
          }).to(truck, {
            x: 0,
            duration: .4
          }).to(truck, {
            x: 40,
            duration: 1
          }).to(truck, {
            x: 20,
            duration: .6
          }).to(truck, {
            x: 96,
            duration: .4
          });

          gsap.to(button, {
            '--progress': 1,
            duration: 2.4,
            ease: "power2.in"
          });
        }
      });

    } catch (err) {
      // API failed, reset everything
      setIsAnimating(false);
      button.classList.remove('animation', 'done');
      gsap.killTweensOf([button, box, truck]);
      gsap.set(truck, { x: 4 });
      gsap.set(button, {
        '--progress': 0,
        '--hx': 0,
        '--bx': 0,
        '--box-s': .5,
        '--box-o': 0,
        '--truck-y': 0,
        '--truck-y-n': -26
      });
      gsap.set(box, { x: -24, y: -6 });
    }
  };

  return (
    <button className={`truck-button ${className}`} style={style} ref={buttonRef} onClick={handleClick}>
      <span className="default">{defaultText}</span>
      <span className="success">
        {successText}
        <svg viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
        </svg>
      </span>
      <div className="truck" ref={truckRef}>
        <div className="wheel"></div>
        <div className="back"></div>
        <div className="front"></div>
        <div className="box" ref={boxRef}></div>
      </div>
    </button>
  );
};

export default TruckButton;
