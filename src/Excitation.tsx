import React, { useState, useEffect, useRef } from 'react';
import { Web3 } from 'web3';
import { XSign } from './Control';
import './Excitation.css';

function LoginDialog({ setModalOpen, address, setAddress }) {
    const [web3, setWeb3] = useState(new Web3('https://eth.llamarpc.com'));
    const [nBlock, setNBlock] = useState(0);
    const [privateKey, setPrivateKey] = useState('');
    const [balance, setBalance] = useState(0);
    const [privateKeyToEnter, setPrivateKeyToEnter] = useState('');
    const [signupModalOpen, setSignupModalOpen] = useState(false);
    useEffect(() => {
        const getBlockNumber = async () => {
            return await web3.eth.getBlockNumber();
        }
        getBlockNumber().then(res => setNBlock(res)).catch(error => {
            console.error('Error occurred:', error);
        });

    }, []);

    useEffect(() => {
        if (address) {
            const getBalance = async () => {
                return await web3.eth.getBalance(address);
            };

            getBalance().then(balance => {
                const balanceInEther = web3.utils.fromWei(balance, 'ether');
                setBalance(balanceInEther);
            }).catch(error => {
                console.error('查询账户余额失败:', error);
            });

        }
    }, [address]);

    const onChange = (e) => {
        setPrivateKeyToEnter(e.target.value);
    };

    const login = async () => {
        if (!privateKeyToEnter) return;
        try {
            const res = await web3.eth.accounts.privateKeyToAccount(privateKeyToEnter);
            if (res) {
                setAddress(res.address);
                localStorage.setItem('ethAddress', res.address);
            }
        } catch (e) {
            alert('密钥错误');
        }

    };

    const logout = () => {
        setAddress('');
    };

    const signup = () => {
        setSignupModalOpen(true);
    };


    return (
        <>
            <div className='modal-overlay-x'>
                <div className='modal-x'>
                    <MetaMaskIntegration />
                    <XSign onClick={() => setModalOpen(false)} />
                    <>
                        <span>{'当前账号：' + address}</span>
                        <span>{'余额：' + balance}</span>
                        {/* <button onClick={logout}>登出</button> */}
                    </> :
                    <>
                        <textarea
                            placeholder='输入密钥'
                            value={privateKeyToEnter}
                            onChange={onChange}
                        />
                        <button onClick={login}>登录</button>
                        <button onClick={signup}>注册</button>
                    </>
                    {
                        signupModalOpen &&
                        <SignupDialog setModalOpen={setSignupModalOpen}
                            web3={web3} address={address} privateKey={privateKey}
                            setAddress={setAddress} setPrivateKey={setPrivateKey} />
                    }
                </div>
            </div>
        </>
    );
}

function SignupDialog({ setModalOpen, web3, address, setAddress, privateKey, setPrivateKey }) {
    useEffect(() => {
        const createAccount = async () => {
            return await web3.eth.accounts.create();
        };
        createAccount().then(res => {
            setAddress(res.address);
            setPrivateKey(res.privateKey);
        });
    }, []);

    const login = () => {
        setModalOpen(false);
    };

    const save = () => {
        const content = `账户：${address}\n私钥：${privateKey}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const anchor = document.createElement('a');
        anchor.download = `address_${address}.txt`;
        anchor.href = window.URL.createObjectURL(blob);
        anchor.click();
        window.URL.revokeObjectURL(anchor.href);
    }

    return (
        <>
            <div className='modal-overlay-x' style={{ zIndex: '1' }}>
                <div className='modal-x'>
                    <span>{'账户：' + address}</span>
                    <span>{'私钥：' + privateKey}</span>
                    <button onClick={save}>保存密钥</button>
                    <button onClick={login}>登录</button>
                </div>
            </div>
        </>
    );
}

function MetaMaskIntegration() {
    const [web3, setWeb3] = useState(null);

    useEffect(() => {
        async function connectToMetaMask() {
            if (window.ethereum) {
                try {
                    // 请求用户授权连接到 MetaMask
                    await window.ethereum.request({ method: 'eth_requestAccounts' });

                    // 创建 Web3 实例，使用 MetaMask 提供的 Provider
                    const provider = new Web3(window.ethereum);
                    setWeb3(provider);
                } catch (error) {
                    console.error('连接到 MetaMask 失败:', error);
                }
            } else {
                console.error('MetaMask 未安装');
            }
        }

        connectToMetaMask();
    }, []);

    return (
        <div>
            {/* 在这里可以使用 web3 对象进行与以太坊网络的交互 */}
        </div>
    );
}

export {
    LoginDialog
}
