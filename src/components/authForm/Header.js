export default function Header( { isLogin } ) {
    return (
        <div className='text-center space-y-7'>
            <h3 className='text-5xl font-bold tracking-tight text-(--custom-cream-yellow)'>BidHub</h3>
            <h2 className='text-center text-2xl/9 font-bold tracking-tight text-white'>{isLogin?'Login to your account!':'Register your account today!'}{/*Register your account today!*/}</h2>
        </div>
    );
};