import {expectType} from 'tsd';
import {isMatch, firstMatch, matches, Match} from './index.js';

expectType<boolean>(isMatch(/\d/, '1', {timeout: 1000}));
expectType<Match | undefined>(firstMatch(/\d/, '1', {timeout: 1000}));
expectType<Iterable<Match>>(matches(/\d/, '1', {timeout: 1000}));
