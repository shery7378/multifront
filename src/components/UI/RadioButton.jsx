//src/components/UI/RadioButton.jsx
const sizeMap = {
    sm: { outer: 'w-3 h-3', inner: 'w-2 h-2' },
    md: { outer: 'w-4 h-4', inner: 'w-3 h-3' },
    lg: { outer: 'w-5 h-5', inner: 'w-4 h-4' },
};

export default function RadioButton({ label, value, name, checked, onChange, size = 'md', id = '', labelClassName = '' }) {
    const { outer, inner } = sizeMap[size] || sizeMap['md'];

    return (
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="radio"
                id={id}
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className={`
          appearance-none cursor-pointer ${outer} border-2 border-gray-200 rounded-full
          checked:border-vivid-red checked:bg-vivid-red focus:ring-vivid-red relative
          checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto
          checked:after:${inner} checked:after:border-2 checked:after:border-white
          checked:after:bg-vivid-red checked:after:rounded-full
        `}
            />
            <span
                className={`${labelClassName} font-bold text-lg text-oxford-blue`} // 👈 Merge base + custom classes
            >
                {label}
            </span>
        </label>
    );
}


// Basic Example
{/* <RadioButton
    label="Male"
    value="male"
    name="gender"
    size="md"
    checked={gender === 'male'}
    onChange={() => setGender('male')}
/> */}

// With Map – Delivery Options
{/* <RadioButton
    key={option}
    label={option}
    value={option}
    name="delivery"
    checked={selected === option}
    onChange={() => setSelected(option)}
/> */}

// Inside a Form

{/* <RadioButton
    label="PayPal"
    value="paypal"
    name="payment"
    checked={paymentMethod === 'paypal'}
    onChange={() => setPaymentMethod('paypal')}
/> */}