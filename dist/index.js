'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
	console.warn('getUserMedia() must be run from a secure origin: https or localhost.\nChanging protocol to https.');
}
if (!navigator.mediaDevices && !navigator.getUserMedia) {
	console.warn('Your browser doesn\'t support navigator.mediaDevices.getUserMedia and navigator.getUserMedia.');
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// stop hack
// from http://stackoverflow.com/questions/11642926/stop-close-webcam-which-is-opened-by-navigator-getusermedia
var MediaStream = window.MediaStream || window.webkitMediaStream;;
if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {
	MediaStream.prototype.stop = function () {
		this.getAudioTracks().forEach(function (track) {
			track.stop();
		});

		this.getVideoTracks().forEach(function (track) {
			track.stop();
		});
	};
}

var ReactMediaRecorder = function (_Component) {
	_inherits(ReactMediaRecorder, _Component);

	function ReactMediaRecorder(props) {
		_classCallCheck(this, ReactMediaRecorder);

		var _this = _possibleConstructorReturn(this, (ReactMediaRecorder.__proto__ || Object.getPrototypeOf(ReactMediaRecorder)).call(this, props));

		_this.state = {
			asked: false,
			permission: false,
			available: false,
			recording: false,
			paused: false
		};

		_this.stream = null;
		_this.mediaRecorder = null;
		_this.mediaChunk = [];

		_this.start = _this.start.bind(_this);
		_this.stop = _this.stop.bind(_this);
		_this.pause = _this.pause.bind(_this);
		_this.resume = _this.resume.bind(_this);
		_this.initMediaRecorder = _this.initMediaRecorder.bind(_this);
		return _this;
	}

	_createClass(ReactMediaRecorder, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var _this2 = this;

			var width = this.props.width;
			var height = this.props.height;
			var constraints = this.props.constraints;

			var handleSuccess = function handleSuccess(stream) {
				_this2.stream = stream;
				_this2.mediaChunk = [];

				_this2.setState({
					permission: true,
					asked: true,
					recording: false
				});
				_this2.props.onGranted();

				_this2.initMediaRecorder();
			};
			var handleFailed = function handleFailed(err) {
				_this2.setState({ asked: false });
				_this2.props.onDenied(err);
			};

			if (navigator.mediaDevices) {
				navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleFailed);
			} else if (navigator.getUserMedia) {
				navigator.getUserMedia(constraints, handleSuccess, handleFailed);
			} else {
				var errMessage = 'Browser doesn\'t support UserMedia API. Please try with another browser.';
				console.warn(errMessage);

				this.props.onError(new Error(errMessage));
			}
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			this.mediaRecorder = null;
			this.mediaChunk = [];

			this.stream.stop();
			this.stream = null;
		}
	}, {
		key: 'initMediaRecorder',
		value: function initMediaRecorder() {
			var _this3 = this;

			try {
				var options = {};
				var types = ['video/webm;codecs=vp8', 'video/webm', ''];

				if (this.props.mimeType) types.unshift(this.props.mimeType);

				for (var i = 0; i < types.length; i++) {
					var type = types[i];

					if (MediaRecorder.isTypeSupported(type)) {
						options.mimeType = type;
						break;
					}

					console.warn(type + ' is not supported on your browser.');
				}

				var mediaRecorder = new MediaRecorder(this.stream, options);

				mediaRecorder.ondataavailable = function (ev) {
					if (ev.data && ev.data.size > 0) {
						_this3.mediaChunk.push(ev.data);
					}
				};

				this.mediaRecorder = mediaRecorder;

				this.setState({
					available: true
				});
			} catch (err) {
				console.log(err);
				console.error('Failed to initialize MediaRecorder.', err);

				this.setState({
					available: false
				});
			}
		}
	}, {
		key: 'start',
		value: function start() {
			if (!this.state.available) return;

			this.mediaChunk = [];
			this.mediaRecorder.start(this.props.timeSlice);

			this.setState({
				recording: true
			});

			this.props.onStart(this.stream);
		}
	}, {
		key: 'pause',
		value: function pause() {
			if (!this.state.recording) return;
			this.mediaRecorder.stop();

			this.setState({ paused: true });

			this.props.onPause();
		}
	}, {
		key: 'resume',
		value: function resume() {
			if (!this.state.recording) return;
			this.initMediaRecorder();
			this.mediaRecorder.start(this.props.timeSlice);

			this.setState({ paused: false });

			this.props.onResume(this.stream);
		}
	}, {
		key: 'stop',
		value: function stop() {
			if (!this.state.available) return;

			this.mediaRecorder.stop();

			this.setState({
				recording: false
			});

			var blob = new Blob(this.mediaChunk, { type: 'video/webm' });
			this.props.onStop(blob);
		}
	}, {
		key: 'render',
		value: function render() {
			var asked = this.state.asked;
			var permission = this.state.permission;
			var recording = this.state.recording;
			var available = this.state.available;

			return _react2.default.createElement(
				'div',
				{ className: this.props.className },
				this.props.render({
					start: this.start,
					stop: this.stop,
					pause: this.pause,
					resume: this.resume
				})
			);
		}
	}]);

	return ReactMediaRecorder;
}(_react.Component);

ReactMediaRecorder.propTypes = {
	constraints: _propTypes2.default.object,
	className: _propTypes2.default.string,
	timeSlice: _propTypes2.default.number,
	mimeType: _propTypes2.default.string,
	render: _propTypes2.default.func,
	onGranted: _propTypes2.default.func,
	onDenied: _propTypes2.default.func,
	onStart: _propTypes2.default.func,
	onStop: _propTypes2.default.func,
	onPause: _propTypes2.default.func,
	onResume: _propTypes2.default.func,
	onError: _propTypes2.default.func
};
ReactMediaRecorder.defaultProps = {
	constraints: {
		audio: true,
		video: true
	},
	className: '',
	timeSlice: 0,
	mimeType: '',
	render: function render() {},
	onGranted: function onGranted() {},
	onDenied: function onDenied() {},
	onStart: function onStart() {},
	onStop: function onStop() {},
	onPause: function onPause() {},
	onResume: function onResume() {},
	onError: function onError() {}
};

exports.default = ReactMediaRecorder;