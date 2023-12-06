// // import axios from 'axios';
// // import { ConfigService } from '../../../../../../config/config.service';

// import { BlockchainConfigFactory } from '../../../../../../config/blockchain/factory.class';
// import Moralis from 'moralis';
// import { EvmChain, GetInternalTransactionsResponseAdapter } from '@moralisweb3/common-evm-utils';

// // const chatId = '5704874161';

// // const message = `<a href="https://example.com">This is an example</a>`;

// // const configService = ConfigService.getInstance();

// // axios
// //     .post(`https://api.telegram.org/bot${configService.get('BOT_TOKEN')}/sendMessage`, {
// //         chat_id: chatId,
// //         text: message,
// //         parse_mode: 'HTML',
// //     })
// //     .then(response => console.log(response.data))
// //     .catch(err => console.error(err));

// const providerEtherscan = BlockchainConfigFactory.getInstance().LOOKUP_CONFIG.getEtherscanProvider();
// BlockchainConfigFactory.getInstance()
//     .LOOKUP_CONFIG.startMoralis()
//     .then()
//     .catch(err => console.log(err));

// async function getSth() {
//     const transactionHash = '0xa5dde1cf96ee78600d30871a5a65308c9965614d30cfabb1f437e100e94e6db8';

//     const chain = EvmChain.SEPOLIA;

//     const response: GetInternalTransactionsResponseAdapter = await Moralis.EvmApi.transaction.getInternalTransactions({
//         transactionHash,
//         chain,
//     });

//     console.log(response.toJSON());

//     response.result.forEach(element => {
//         console.log(element);
//     });
// }

// getSth()
//     .then()
//     .catch(err => console.log(err));
